// Re-seed an existing, fully migrated Neon branch without dropping its baseline schema.
import 'dotenv/config';
import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {PrismaClient} from '@prisma/client';
import {seedDate} from './seeds/context.js';
import {seedBelfoods} from './belfoods/seed.js';
import {models,verifyBelfoods} from './belfoods/verify.js';

const args=process.argv.slice(2);
const option=name=>args.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
const url=new URL(process.env.DATABASE_URL||'postgres://invalid/');
const expectedHost=option('expected-host');
const backupBranch=option('backup-branch');
const db=new PrismaClient();
try{
 assert.ok(args.includes('--reset'),'Specify --reset explicitly');
 assert.ok(expectedHost&&url.hostname===expectedHost,'Neon hostname differs from the explicit target');
 assert.ok(url.hostname.endsWith('.neon.tech')&&!url.hostname.includes('-pooler'),'Use a direct Neon connection');
 assert.equal(decodeURIComponent(url.pathname.slice(1)),'neondb','Unexpected database name');
 assert.ok(args.includes('--test-branch')||backupBranch&&/^br-[a-z0-9-]+$/.test(backupBranch),'Provide the verified backup branch id for a production reset');
 const tables=await db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
 const auxiliary=['socket_io_attachments'];
 assert.deepEqual(tables.map(row=>row.tablename).filter(name=>name!=='_prisma_migrations'&&!auxiliary.includes(name)).sort(),models.map(model=>model.table).sort(),'Schema contains unexpected or missing tables');
 const migrations=await db.$queryRaw`SELECT migration_name,finished_at,rolled_back_at FROM _prisma_migrations ORDER BY migration_name`;
 const applied=migrations.filter(row=>row.finished_at&&!row.rolled_back_at).map(row=>row.migration_name);
 const directory=fileURLToPath(new URL('./migrations/',import.meta.url));
 const expected=readdirSync(directory,{withFileTypes:true}).filter(entry=>entry.isDirectory()).map(entry=>entry.name).sort();
 assert.deepEqual(applied,expected,'Apply all migration files before reset');
 const date=seedDate();
 const quoted=[...models.map(model=>model.table),...auxiliary.filter(name=>tables.some(table=>table.tablename===name))].map(name=>{assert.match(name,/^[A-Za-z_][A-Za-z0-9_]*$/);return `"public"."${name}"`;}).join(', ');
 const report=await db.$transaction(async tx=>{
  await tx.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY`);
  await seedBelfoods(tx,date);
  const verification=await verifyBelfoods(tx,date,{exact:true});
  assert.deepEqual((await tx.$queryRaw`SELECT migration_name,finished_at,rolled_back_at FROM _prisma_migrations ORDER BY migration_name`).map(row=>row.migration_name),migrations.map(row=>row.migration_name));
  return verification;
 },{timeout:120000,maxWait:10000});
 console.log(JSON.stringify({target:url.hostname,database:'neondb',backupBranch:backupBranch||null,testBranch:args.includes('--test-branch'),...report},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}finally{await db.$disconnect();}
