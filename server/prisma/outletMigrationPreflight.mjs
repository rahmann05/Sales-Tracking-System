import 'dotenv/config';
import {Client} from 'pg';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {readdirSync,writeFileSync} from 'node:fs';
import {cleanLegacyOutletEvidence,cleanProviderCache} from '../src/modules/outlets/services/outlet-legacy-content.service.js';
const args=process.argv.slice(2),apply=args.includes('--apply'),confirm=args.find(a=>a.startsWith('--confirm='))?.slice(10);
const local=['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname);
const target=new URL(process.env.DATABASE_URL),targetFingerprint=createHash('sha256').update(target.hostname+':'+target.port+target.pathname+(target.searchParams.get('schema')||'public')).digest('hex').slice(0,16);
if(apply&&!local&&!args.includes('--allow-remote'))throw Error('Remote cleanup requires explicit --allow-remote after reviewed dry-run. No migration is run by this tool.');
const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();
const now=new Date(),report={at:now.toISOString(),target:local?'LOCAL':'REMOTE',targetFingerprint,mode:apply?'APPLY':'DRY_RUN',blockers:[],warnings:[],counts:{},pendingMigrations:[],cleanup:{},digest:null};
let operations=[];
const same=(a,b)=>isDeepStrictEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
try{
 await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ'+(apply?'':' READ ONLY'));
 const columns=(await db.query(`SELECT table_name,column_name FROM information_schema.columns WHERE table_schema=current_schema()`)).rows;
 const has=(table,col)=>columns.some(r=>r.table_name===table&&(!col||r.column_name===col));
 if(!has('Outlet'))throw Error('Outlet table missing: wrong schema/target');
 if(has('_prisma_migrations')){
  const rows=(await db.query('SELECT migration_name,finished_at,rolled_back_at FROM "_prisma_migrations"')).rows;
  if(rows.some(r=>!r.finished_at&&!r.rolled_back_at))report.blockers.push('UNFINISHED_MIGRATION');
  const done=new Set(rows.filter(r=>r.finished_at).map(r=>r.migration_name));
  report.pendingMigrations=readdirSync('prisma/migrations',{withFileTypes:true}).filter(d=>d.isDirectory()&&!done.has(d.name)).map(d=>d.name).sort();
 }else report.blockers.push('MIGRATION_BASELINE_MISSING');
 const pair=(await db.query('SELECT count(*)::int n FROM "Outlet" WHERE (latitude IS NULL) <> (longitude IS NULL)')).rows[0].n;
 const invalid=(await db.query('SELECT count(*)::int n FROM "Outlet" WHERE latitude NOT BETWEEN -90 AND 90 OR longitude NOT BETWEEN -180 AND 180')).rows[0].n;
 report.counts.partialCoordinatePairs=pair;report.counts.invalidCoordinates=invalid;
 if(pair)report.blockers.push('PARTIAL_NATIVE_COORDINATES_REQUIRE_REVIEW');if(invalid)report.blockers.push('INVALID_NATIVE_COORDINATES_REQUIRE_REVIEW');
 for(const table of ['Outlet','OutletReview','OutletValidationRun','OutletFieldTask','PjpStop','Order','AuditEvent'])if(has(table))report.counts[table]=(await db.query(`SELECT count(*)::int n FROM "${table}"`)).rows[0].n;
 const plan=async(table,fields,transform)=>{
  fields=fields.filter(f=>has(table,f));if(!fields.length)return;
  const rows=(await db.query(`SELECT id,${fields.map(f=>`"${f}"`).join(',')} FROM "${table}" ${table==='AuditEvent'?'WHERE "entityType" IN (\'OUTLET\',\'OUTLET_REVIEW\',\'OUTLET_VALIDATION\',\'OUTLET_LOCATION\')':''} ORDER BY id`)).rows;
  let affected=0;
  for(const row of rows){const after=Object.fromEntries(Object.entries(transform(row)).filter(([k])=>fields.includes(k))),before=Object.fromEntries(Object.keys(after).map(k=>[k,row[k]]));if(!same(before,after)){operations.push({table,id:row.id,before,after});affected++;}}
  report.cleanup[table]=affected;
 };
 await plan('Outlet',['validationDetails','googleSuggestedLat','googleSuggestedLng'],r=>({validationDetails:cleanLegacyOutletEvidence(r.validationDetails),googleSuggestedLat:null,googleSuggestedLng:null}));
 await plan('OutletValidationRun',['result','providerContent','providerExpiresAt','createdAt'],r=>({result:cleanLegacyOutletEvidence(r.result),...cleanProviderCache(r.providerContent,r.providerExpiresAt,r.createdAt,now)}));
 await plan('OutletReview',['decision'],r=>({decision:cleanLegacyOutletEvidence(r.decision)}));
 await plan('AuditEvent',['before','after'],r=>({before:cleanLegacyOutletEvidence(r.before),after:cleanLegacyOutletEvidence(r.after)}));
 report.digest=createHash('sha256').update(targetFingerprint+JSON.stringify(operations)).digest('hex');
 const constraint=await db.query(`SELECT convalidated FROM pg_constraint WHERE conrelid='"Outlet"'::regclass AND conname='Outlet_coordinate_pair'`);
 report.coordinateConstraint=constraint.rows[0]?.convalidated===true?'VALIDATED':constraint.rows.length?'NOT_VALIDATED':'NOT_CREATED';
 if(report.coordinateConstraint!=='VALIDATED')report.warnings.push('Validate coordinate constraint after native pair review and migration.');
 if(has('OutletFieldTask','schedule'))report.counts.legacyUnscheduledFieldTasks=(await db.query(`SELECT count(*)::int n FROM "OutletFieldTask" WHERE status IN ('OPEN','SUBMITTED') AND (schedule='{}'::jsonb OR schedule IS NULL)`)).rows[0].n;
 if(apply){
  if(report.blockers.length)throw Error('Preflight blockers: '+report.blockers.join(', '));
  if(report.pendingMigrations.length)throw Error('Review and deploy pending migrations before applying cleanup; then rerun dry-run.');
  if(confirm!==report.digest)throw Error('Dry-run digest differs or missing; rerun dry-run and review before --apply.');
  for(const op of operations){const fields=Object.keys(op.after);await db.query(`UPDATE "${op.table}" SET ${fields.map((f,i)=>`"${f}"=$${i+1}`).join(',')} WHERE id=$${fields.length+1}`,fields.map(k=>{
   const v=op.after[k];if(['providerExpiresAt','googleSuggestedLat','googleSuggestedLng'].includes(k))return v;
   return v===null&&!(op.table==='AuditEvent'||op.table==='OutletValidationRun'&&k==='result')?null:JSON.stringify(v);
  }).concat(op.id));}
 }
 await db.query(apply?'COMMIT':'ROLLBACK');
 // Report contains counts and a digest only; no provider payload, coordinates, credentials or customer contacts.
 writeFileSync('../docs/OV13_OUTLET_MIGRATION_PREFLIGHT.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 if(report.blockers.length)process.exitCode=2;
}catch(e){await db.query('ROLLBACK').catch(()=>{});throw e;}finally{await db.end();}
