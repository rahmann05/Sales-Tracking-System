// Read-only release preflight. Does not deploy, migrate, authenticate as a user or write business data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import {Prisma} from '@prisma/client';

assert.ok(process.argv.includes('--read-only'),'Explicit --read-only required');
const server=fileURLToPath(new URL('../',import.meta.url));
const local=dotenv.parse(fs.readFileSync(path.join(server,'.env'))),production=dotenv.parse(fs.readFileSync(path.join(server,'.env.production')));
const localUrl=local.DIRECT_URL||local.DATABASE_URL,remoteUrl=production.DIRECT_URL||production.DATABASE_URL;
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(localUrl).hostname),'Local baseline required');
assert.ok(new URL(remoteUrl).hostname.endsWith('.neon.tech'),'Configured Neon destination required');
const tables=Prisma.dmmf.datamodel.models.map(m=>m.dbName||m.name);
async function inspect(connectionString){
 const url=new URL(connectionString);if(['require','prefer','verify-ca'].includes(url.searchParams.get('sslmode')))url.searchParams.set('sslmode','verify-full');
 connectionString=url.toString();
 const client=new pg.Client({connectionString,connectionTimeoutMillis:10000});
 try{
  await client.connect();await client.query('BEGIN READ ONLY');await client.query("SET LOCAL statement_timeout = '15s'");
  const migrations=(await client.query('SELECT migration_name, checksum, finished_at, rolled_back_at FROM public._prisma_migrations ORDER BY migration_name')).rows;
  const columns=(await client.query('SELECT table_name,column_name,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema=$1 AND table_name=ANY($2::text[]) ORDER BY table_name,ordinal_position',['public',tables])).rows;
  const enums=(await client.query("SELECT t.typname,e.enumlabel,e.enumsortorder FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' ORDER BY t.typname,e.enumsortorder")).rows;
  await client.query('ROLLBACK');return {migrations,columns,enums};
 }finally{await client.end();}
}
const [baseline,remote]=await Promise.all([inspect(localUrl),inspect(remoteUrl)]);
const active=rows=>rows.filter(r=>r.finished_at&&!r.rolled_back_at),applied=active(remote.migrations);
const folders=fs.readdirSync(path.join(server,'prisma/migrations'),{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>e.name).sort();
const hashes=new Map(folders.map(name=>[name,createHash('sha256').update(fs.readFileSync(path.join(server,'prisma/migrations',name,'migration.sql'))).digest('hex')]));
const missing=folders.filter(name=>!applied.some(r=>r.migration_name===name));
const checksumDifferences=applied.filter(r=>hashes.has(r.migration_name)&&hashes.get(r.migration_name)!==r.checksum).map(r=>r.migration_name);
const columnKey=row=>row.table_name+'.'+row.column_name;
const remoteColumns=new Map(remote.columns.map(r=>[columnKey(r),r]));
const columnDifferences=baseline.columns.filter(r=>JSON.stringify(r)!==JSON.stringify(remoteColumns.get(columnKey(r)))).map(columnKey);
const extraColumns=remote.columns.filter(r=>!baseline.columns.some(b=>columnKey(b)===columnKey(r))).map(columnKey);
const enumDifferences=[...new Set(baseline.enums.filter(r=>!remote.enums.some(b=>JSON.stringify(b)===JSON.stringify(r))).map(r=>r.typname))];
const backend='https://sinar-anugrah-production.up.railway.app';
const origins=String(production.CLIENT_ORIGIN||'').split(',').map(s=>s.trim()).filter(s=>/^https:\/\//.test(s));
const frontendIndex=process.argv.indexOf('--frontend');
if(frontendIndex>=0){const frontend=new URL(process.argv[frontendIndex+1]);assert.ok(frontend.protocol==='https:'&&frontend.hostname.endsWith('.vercel.app'),'Verified Vercel frontend URL required');origins.push(frontend.origin);}
const report={at:new Date().toISOString(),readOnly:true,localApplied:active(baseline.migrations).length,remoteApplied:applied.length,expectedMigrations:folders.length,missingMigrations:missing,checksumDifferences,unfinishedMigrations:remote.migrations.filter(r=>!r.finished_at&&!r.rolled_back_at).map(r=>r.migration_name),columnDifferences,extraColumns,enumDifferences,http:[]};
for(const url of [backend+'/api/v1/health',backend+'/api/v1/health/monitoring',...origins.map(origin=>origin.replace(/\/$/,'')+'/api/v1/health')]){
 try{
  const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000)}),type=response.headers.get('content-type')||'';
  const body=type.includes('application/json')?await response.json():null;
  report.http.push({url,status:response.status,json:type.includes('application/json'),success:body?.success===true});
 }catch(error){report.http.push({url,status:null,error:error.name});}
}
report.schemaReady=!missing.length&&!checksumDifferences.length&&!report.unfinishedMigrations.length&&!columnDifferences.length&&!extraColumns.length&&!enumDifferences.length;
report.scope='Schema metadata and public HTTP availability only; does not establish deployed source version, production worker/socket behavior or full business smoke tests.';
fs.writeFileSync(path.join(server,'../docs/SYSTEM_PRODUCTION_PREFLIGHT_20261011.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
process.exitCode=report.schemaReady?0:2;
