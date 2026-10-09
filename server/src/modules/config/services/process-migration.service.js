import {createHash} from 'node:crypto';
import {z} from 'zod';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {CONFIG_DEFAULTS} from '../../../../../shared/config.mjs';
import {DRIVER_EVIDENCE_KEYS,policyConflicts} from '../../../../../shared/operational-policy.mjs';
import {orderApprovalDecision,reviewRoleAllowed} from '../../../../../shared/approval-workflow.mjs';
import {preparationStages} from '../../../../../shared/warehouse-policy.mjs';
import {effectivePolicy} from './policy-resolver.service.js';
import {policySnapshot} from './process-policy.service.js';
import {broadcastCacheInvalidation} from '../../../config/socket.js';
const definitions={
 ORDER:{model:'order',owner:'createdBy',open:{deletedAt:null,status:'PENDING_APPROVAL'},key:k=>k.startsWith('ORDER_APPROVAL_')||k==='ORDER_PRICE_OVERRIDE_APPROVAL_MODE'},
 REGISTRATION:{model:'customerRegistration',owner:'salesmanId',open:{registrationStatus:{in:['SUBMITTED','PENDING','SPV_APPROVED']}},key:k=>['REGISTRATION_APPROVAL_MODE','REGISTRATION_ACTIVATOR','REGISTRATION_ALLOW_REVISION'].includes(k)},
 PACKING:{model:'packingList',owner:'createdById',open:{status:'DRAFT'},key:k=>k.startsWith('PACKING_')},
 TRIP:{model:'deliveryRoute',owner:'createdById',open:{closedAt:null,cancelledAt:null},key:k=>k.startsWith('WAREHOUSE_')||k.startsWith('TRIP_')||DRIVER_EVIDENCE_KEYS.includes(k)},
};
const request=z.object({kind:z.enum(['ORDER','REGISTRATION','PACKING','TRIP']),ids:z.array(z.string().min(1)).min(1).max(20)}).strict();
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
async function candidate(db,kind,row){
 const d=definitions[kind],actor=await db.user.findUnique({where:{id:row[d.owner]}});
 if(!actor||actor.deletedAt)return {reason:'Pembuat tidak aktif; perbaiki penanggung jawab terlebih dahulu.'};
 if(!row.policySnapshot?.values)return {reason:'Snapshot awal belum tersedia; pertahankan aturan proses lama.'};
 const resolved=await effectivePolicy(actor,Date.now(),{fresh:true});
 const old=row.policySnapshot||policySnapshot(resolved),values={...CONFIG_DEFAULTS,...old.values};
 for(const [key,value] of Object.entries(resolved.values))if(d.key(key))values[key]=value;
 const next={...old,values,versions:old.versions||[]};
 if(kind==='ORDER'){
  if(row.approvedAt||(row.history||[]).some(h=>['SUPERVISOR_REVIEW','APPROVE','REJECT'].includes(h.action)))return {reason:'Keputusan pemeriksa sudah tercatat; tahap persetujuan harus dipertahankan.'};
  const decision=orderApprovalDecision({totalValue:row.totalValue,hasPriceOverride:Boolean(old.orderApproval?.hasPriceOverride||old.orderApproval?.priceOverrides?.length)},values);
  if(decision.mode==='NONE')return {reason:'Migrasi tidak boleh menyetujui order otomatis. Selesaikan order memakai alur awal.'};
  next.orderApproval={...old.orderApproval,...decision};values.ORDER_APPROVAL_MODE=decision.mode;
  const assignment=(await db.systemConfig.findUnique({where:{key:`_ORDER_REVIEW:${row.id}`}}))?.value;
  if(assignment?.ownerId&&!reviewRoleAllowed(decision.mode==='SEQUENTIAL'?'SUPERVISOR':decision.mode,assignment.ownerRole))return {reason:'PIC pemeriksa saat ini tidak sesuai alur baru. Alihkan penugasan dahulu.'};
  const supervisors=actor.supervisorId?await db.user.findMany({where:{id:actor.supervisorId,role:'SUPERVISOR',deletedAt:null}}):[];
  const admins=await db.user.findMany({where:{role:'ADMIN',deletedAt:null,id:{not:actor.id}}});
  const valid=list=>list.some(p=>p.permissions?.can_approve_order!==false);
  if((['SUPERVISOR','SEQUENTIAL'].includes(decision.mode)&&!valid(supervisors))||(['ADMIN','SEQUENTIAL'].includes(decision.mode)&&!valid(admins))||(decision.mode==='BOTH'&&!valid([...admins,...supervisors])))return {reason:'Alur baru belum memiliki pemeriksa aktif yang memenuhi syarat.'};
 }
 if(kind==='REGISTRATION'&&(row.registrationStatus==='SPV_APPROVED'||row.spvApprovedAt))return {reason:'Pengajuan sudah melewati pemeriksaan; gunakan alur awal hingga aktivasi.'};
 if(kind==='TRIP'){
  if(row.departedAt||row.returnedAt||!['DRAFT','READY'].includes(row.status)||['PICK','CHECK','LOAD'].some(k=>row.preparation?.[k]))return {reason:'Persiapan atau perjalanan sudah dimulai; bukti awal harus dipertahankan.'};
  const driver=await db.user.findUnique({where:{id:row.driverId}});
  if(!driver||driver.deletedAt)return {reason:'Driver tidak aktif.'};
  const p=await effectivePolicy(driver,Date.now(),{fresh:true});for(const key of DRIVER_EVIDENCE_KEYS)values[key]=p.values[key];
  next.driver={id:driver.id,versions:p.versions,at:old.driver?.at||old.at};
  if(Object.keys(row.preparation?.tasks||{}).some(stage=>!preparationStages(values).includes(stage)))return {reason:'Ada penugasan tahap yang dihapus oleh aturan baru. Selesaikan pengalihan penugasan dahulu.'};
 }
 const conflicts=policyConflicts(values);if(conflicts.length)return {reason:conflicts.join(' ')};
 const changes=Object.entries(values).filter(([key,value])=>d.key(key)&&!same(value,old.values?.[key]??CONFIG_DEFAULTS[key])).map(([key,after])=>({key,before:old.values?.[key]??CONFIG_DEFAULTS[key],after}));
 return {next,versions:resolved.versions,changes,reason:changes.length?null:'Tidak ada aturan proses yang berubah.'};
}
function view(row,result){return {id:row.id,label:row.code||row.name||row.customerCode||row.id,status:row.status||row.registrationStatus,updatedAt:row.updatedAt,eligible:!result.reason,reason:result.reason||null,changes:result.changes||[],versions:result.versions||[],snapshotAt:row.policySnapshot?.at||null};}
export async function listMigrationCandidates(kind){
 if(!definitions[kind])throw new AppError('Jenis proses tidak valid',400);
 const d=definitions[kind],rows=await prisma[d.model].findMany({where:d.open,orderBy:[{createdAt:'desc'},{id:'desc'}],take:101});
 const items=[];for(const row of rows.slice(0,100))items.push(view(row,await candidate(prisma,kind,row)));
 return {items,truncated:rows.length>100,note:'Migrasi hanya mengubah aturan langkah berikutnya. Harga, pajak, isi dokumen, bukti dan keputusan lama tetap. Kunjungan/shift aktif serta hasil tugas yang sudah dikirim mempertahankan snapshot awal.'};
}
async function prepare(db,raw){
 const data=request.parse(raw),d=definitions[data.kind];
 if(new Set(data.ids).size!==data.ids.length)throw new AppError('Proses terpilih duplikat',400);
 const rows=await db[d.model].findMany({where:{...d.open,id:{in:data.ids}},orderBy:{id:'asc'}});
 if(rows.length!==data.ids.length)throw new AppError('Proses sudah berubah atau tidak lagi terbuka; muat ulang',409);
 const results=[];for(const row of rows){const result=await candidate(db,data.kind,row);results.push({row,...result});}
 const fingerprint=createHash('sha256').update(JSON.stringify({kind:data.kind,results:results.map(r=>({row:r.row,next:r.next,versions:r.versions,reason:r.reason}))})).digest('hex');
 return {data,results,fingerprint};
}
export async function previewProcessMigration(raw){
 const {results,fingerprint}=await prepare(prisma,raw);
 return {fingerprint,items:results.map(r=>view(r.row,r)),ready:results.every(r=>!r.reason)};
}
export async function migrateProcesses(raw,actor){
 if(actor?.role!=='ADMIN')throw new AppError('Migrasi aturan hanya dapat dilakukan Admin',403);
 const data=z.object({kind:request.shape.kind,ids:request.shape.ids,fingerprint:z.string().length(64),reason:z.string().trim().min(5).max(2000)}).strict().parse(raw);
 const result=await prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('config:settings'))`;
  for(const id of [...data.ids].sort())await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${data.kind==='TRIP'?'route':data.kind.toLowerCase()}:${id}`}))`;
  const prepared=await prepare(tx,{kind:data.kind,ids:data.ids});
  if(prepared.fingerprint!==data.fingerprint)throw new AppError('Proses atau aturan berubah setelah preview. Tinjau ulang.',409);
  if(prepared.results.some(r=>r.reason))throw new AppError('Ada proses yang tidak memenuhi syarat migrasi.',409);
  for(const {row,next,versions,changes} of prepared.results){
   const at=new Date().toISOString(),snapshot={...next,migrations:[...(row.policySnapshot?.migrations||[]),{at,actorId:actor.id,reason:data.reason,versions,keys:changes.map(c=>c.key)}]};
   const patch={policySnapshot:snapshot,...(data.kind==='PACKING'?{revision:{increment:1}}:{}),...(data.kind==='TRIP'?{status:preparationStages(snapshot.values).length?'DRAFT':'READY'}:{})};
   const changed=await tx[definitions[data.kind].model].updateMany({where:{id:row.id,updatedAt:row.updatedAt},data:patch});
   if(!changed.count)throw new AppError('Proses berubah bersamaan; tinjau ulang.',409);
   await tx.auditEvent.create({data:{entityType:'PROCESS_POLICY_MIGRATION',entityId:row.id,action:'MIGRATE',actorId:actor.id,actorName:actor.name,before:{kind:data.kind,snapshot:row.policySnapshot||{},status:row.status||row.registrationStatus},after:{kind:data.kind,snapshot,changes,reason:data.reason}}});
  }
  return {count:prepared.results.length};
 },{isolationLevel:'Serializable',timeout:60000}).catch(error=>{if(error?.code==='P2034')throw new AppError('Proses berubah bersamaan; muat ulang dan tinjau ulang.',409);throw error;});
 broadcastCacheInvalidation('policies');return result;
}
