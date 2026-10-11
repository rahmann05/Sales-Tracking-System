// Explicit operator release: rehearse against a clone before applying to production.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import pg from 'pg';
import {getCACertificates} from 'node:tls';
const server=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),root=path.dirname(server);
const stage=process.argv.includes('--production')?'production':process.argv.includes('--rehearsal')?'rehearsal':null;
assert.ok(stage,'Explicit --rehearsal or --production required');
const production=dotenv.parse(fs.readFileSync(path.join(server,'.env.production')));
const target=new URL(production.DIRECT_URL||production.DATABASE_URL);
assert.ok(target.hostname.endsWith('.neon.tech')&&!target.hostname.includes('-pooler'),'Direct Neon connection required');
const directory=path.join(root,'.backups','matrix-release-20261011');fs.mkdirSync(directory,{recursive:true});
if(stage==='rehearsal')target.hostname='ep-shy-resonance-b3x9z3ib.c-4.ap-southeast-1.aws.neon.tech';
else {assert.ok(process.argv.includes('--approved'));const rehearsal=JSON.parse(fs.readFileSync(path.join(directory,'rehearsal.json'),'utf8'));assert.equal(rehearsal.success,true);assert.equal(rehearsal.appliedAfter,41);}
if(['require','prefer','verify-ca'].includes(target.searchParams.get('sslmode')))target.searchParams.set('sslmode','verify-full');
const redact=text=>String(text||'').replace(/postgres(?:ql)?:\/\/[^\s"']+/g,'[REDACTED_DATABASE_URL]');
async function snapshot(){
 const db=new pg.Client({connectionString:target.toString(),connectionTimeoutMillis:15000});
 try{await db.connect();await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
 const tables=(await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename!='_prisma_migrations' ORDER BY tablename")).rows;
 const counts={};for(const {tablename} of tables)counts[tablename]=Number((await db.query('SELECT count(*) AS n FROM public."'+tablename.replaceAll('"','""')+'"')).rows[0].n);
 const migrations=(await db.query('SELECT migration_name,checksum FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name')).rows;
 await db.query('ROLLBACK');return {counts,migrations};}finally{await db.end();}
}
const before=await snapshot();assert.equal(before.migrations.length,33,'Unexpected baseline; re-inspect before applying');
let archiveInfo=null;
if(stage==='production'){
 const archive=path.join(directory,'production-before.dump'),pgBin='C:/Program Files/PostgreSQL/18/bin';
 const roots=path.join(directory,'trusted-ca.pem');fs.writeFileSync(roots,getCACertificates('default').join('\n'));
 const backupEnv={...process.env,PGHOST:target.hostname,PGPORT:target.port||'5432',PGDATABASE:decodeURIComponent(target.pathname.slice(1)),PGUSER:decodeURIComponent(target.username),PGPASSWORD:decodeURIComponent(target.password),PGSSLMODE:'verify-full',PGSSLROOTCERT:roots,PGCONNECT_TIMEOUT:'15'};
 const dump=spawnSync(path.join(pgBin,'pg_dump.exe'),['--format=custom','--no-owner','--no-privileges','--file',archive],{env:backupEnv,encoding:'utf8',timeout:120000,windowsHide:true});assert.equal(dump.status,0,'Backup failed: '+redact(dump.stderr));
 const listing=spawnSync(path.join(pgBin,'pg_restore.exe'),['--list',archive],{encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(listing.status,0,'Archive cannot be read');
 archiveInfo={path:path.relative(root,archive).replaceAll('\\','/'),bytes:fs.statSync(archive).size,sha256:createHash('sha256').update(fs.readFileSync(archive)).digest('hex'),archiveListingPassed:true,restoreTested:false,backupBranch:'br-proud-moon-b3v0smxv',expiresAt:'2026-10-18T03:00:00Z'};
 fs.writeFileSync(path.join(directory,'backup.json'),JSON.stringify(archiveInfo,null,2));
}
const startedAt=new Date().toISOString();
const deploy=spawnSync(process.execPath,[path.join(server,'node_modules/prisma/build/index.js'),'migrate','deploy'],{cwd:server,env:{...process.env,DATABASE_URL:target.toString()},encoding:'utf8',timeout:180000,windowsHide:true});
fs.writeFileSync(path.join(directory,stage+'-migration.log'),redact(deploy.stdout)+'\n'+redact(deploy.stderr));assert.equal(deploy.status,0,'Migration failed; inspect redacted log');
const after=await snapshot(),changedCounts=Object.keys(before.counts).filter(table=>before.counts[table]!==after.counts[table]);
const report={stage,startedAt,completedAt:new Date().toISOString(),success:after.migrations.length===41&&changedCounts.length===0,appliedBefore:before.migrations.length,appliedAfter:after.migrations.length,changedCounts,beforeCounts:before.counts,afterCounts:after.counts,migrations:after.migrations.map(m=>m.migration_name),archiveInfo};
fs.writeFileSync(path.join(directory,stage+'.json'),JSON.stringify(report,null,2));assert.equal(report.success,true,'Post-migration count/history check failed');
console.log(JSON.stringify({stage,success:true,appliedBefore:report.appliedBefore,appliedAfter:report.appliedAfter,changedCounts,archiveInfo},null,2));

