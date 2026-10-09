import 'dotenv/config';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {seedDate} from './seeds/context.js';
import {sourceData} from './belfoods/context.js';
import {seedBelfoods} from './belfoods/seed.js';
import {verifyBelfoods,models,snapshot,digest} from './belfoods/verify.js';
const db=new PrismaClient(),args=process.argv.slice(2),target='sales_tracking_system',url=new URL(process.env.DATABASE_URL),dry=args.includes('--dry-run');
try{
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(url.hostname),'Reset only supports localhost');
 assert.equal(decodeURIComponent(url.pathname.slice(1)),target,'Unexpected database target');
 assert.ok(args.includes(`--database=${target}`),'Specify --database=sales_tracking_system explicitly');
 assert.ok(dry||args.includes('--reset'),'Specify --reset or --dry-run explicitly');
 assert.equal(sourceData().outlets.length,20);
 const tables=await db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
 assert.deepEqual(tables.map(t=>t.tablename).filter(t=>t!=='_prisma_migrations').sort(),models.map(m=>m.table).sort(),'Unknown/missing tables; reset refuses to cascade into unclassified data');
 const migrations=await db.$queryRaw`SELECT migration_name,finished_at,rolled_back_at FROM _prisma_migrations ORDER BY migration_name`;
 assert.ok(migrations.every(m=>m.finished_at||m.rolled_back_at),'Unfinished migration');
 const before=await snapshot(db),counts=Object.fromEntries(Object.entries(before).map(([key,rows])=>[key,rows.length]));
 let backup;
 if(!dry){
  const root=fileURLToPath(new URL('../../',import.meta.url)),dir=path.join(root,'.backups','belfoods'),stamp=new Date().toISOString().replaceAll(':','-').replaceAll('.','-');mkdirSync(dir,{recursive:true});
  const executable=path.join(process.env.PG_BIN||'C:\\Program Files\\PostgreSQL\\18\\bin','pg_dump.exe');
  backup=path.join(dir,`${target}-${stamp}.dump`);
  const env={...process.env,PGPASSWORD:decodeURIComponent(url.password)},connection=['--host',url.hostname.replace(/^\[|\]$/g,''),'--port',url.port||'5432','--username',decodeURIComponent(url.username),'--dbname',target];
  const result=spawnSync(executable,[...connection,'--format=custom','--file',backup],{env,encoding:'utf8',timeout:120000,windowsHide:true});
  if(result.status!==0)throw new Error('pg_dump failed; reset was not executed. Check local PostgreSQL tools.');
  assert.ok(statSync(backup).size>0);
  const listing=spawnSync(path.join(path.dirname(executable),'pg_restore.exe'),['--list',backup],{encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(listing.status,0,'Backup archive cannot be read');
  writeFileSync(`${backup}.json`,JSON.stringify({target,host:url.hostname,date:new Date().toISOString(),sha256:createHash('sha256').update(readFileSync(backup)).digest('hex'),counts,note:'pg_restore --list passed; backup includes the full previous database. Not a tested restoration.'},null,2));
  console.log(`Backup verified: ${backup}`);
 }
 const date=seedDate(),quoted=models.map(m=>{assert.match(m.table,/^[A-Za-z_][A-Za-z0-9_]*$/);return `"public"."${m.table}"`;}).join(', ');
 let report;
 try{await db.$transaction(async tx=>{
  await tx.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY`);
  await seedBelfoods(tx,date);report=await verifyBelfoods(tx,date,{exact:true});
  assert.deepEqual(await tx.$queryRaw`SELECT migration_name,finished_at,rolled_back_at FROM _prisma_migrations ORDER BY migration_name`,migrations);
  if(dry)throw new Error('BELFOODS_DRY_RUN_ROLLBACK');
 },{timeout:120000,maxWait:10000});}catch(error){if(!dry||error.message!=='BELFOODS_DRY_RUN_ROLLBACK')throw error;}
 if(dry)assert.equal(digest(await snapshot(db)),digest(before),'Dry run altered persisted data');
 console.log(JSON.stringify({dryRun:dry,backup,...report},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}finally{await db.$disconnect();}
