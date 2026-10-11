// Restores the approved release backup to a fresh LOCAL database. Never overwrites an existing DB.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import dotenv from 'dotenv';
import pg from 'pg';
assert.ok(process.argv.includes('--local'),'Explicit --local required');
const local=new URL(dotenv.parse(fs.readFileSync('.env')).DATABASE_URL);
assert.ok(['localhost','127.0.0.1','[::1]'].includes(local.hostname));
const directory='../.backups/matrix-release-20261011/',archive=directory+'production-before.dump';
const backup=JSON.parse(fs.readFileSync(directory+'backup.json')),release=JSON.parse(fs.readFileSync(directory+'production.json'));
assert.equal(createHash('sha256').update(fs.readFileSync(archive)).digest('hex'),backup.sha256);
const name='matrix_restore_'+randomUUID().replaceAll('-','');assert.match(name,/^matrix_restore_[a-f0-9]{32}$/);
local.pathname='/postgres';const control=new pg.Client({connectionString:local.toString()});
const report={at:new Date().toISOString(),scope:'Full archive restored locally, table counts/migration baseline/FK validation; not Neon failover or provider recovery',archiveSha256:backup.sha256};
let created=false,db;
try{
 await control.connect();await control.query('CREATE DATABASE "'+name+'" TEMPLATE template0');created=true;
 const restore=spawnSync('C:/Program Files/PostgreSQL/18/bin/pg_restore.exe',['--exit-on-error','--no-owner','--no-privileges','--dbname',name,archive],{env:{...process.env,PGHOST:local.hostname,PGPORT:local.port||'5432',PGUSER:decodeURIComponent(local.username),PGPASSWORD:decodeURIComponent(local.password),PGCONNECT_TIMEOUT:'10'},encoding:'utf8',timeout:120000,windowsHide:true});
 assert.equal(restore.status,0,restore.stderr);
 local.pathname='/'+name;db=new pg.Client({connectionString:local.toString()});await db.connect();
 const counts={};for(const table of Object.keys(release.beforeCounts))counts[table]=Number((await db.query('SELECT count(*) AS n FROM public."'+table.replaceAll('"','""')+'"')).rows[0].n);
 assert.deepEqual(counts,release.beforeCounts);report.tableCounts=counts;
 const migrations=Number((await db.query('SELECT count(*) AS n FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL')).rows[0].n);
 assert.equal(migrations,release.appliedBefore);report.migrations=migrations;
 const invalid=(await db.query("SELECT conname FROM pg_constraint WHERE connamespace='public'::regnamespace AND contype='f' AND NOT convalidated")).rows;assert.deepEqual(invalid,[]);
 report.foreignKeysValidated=true;report.status='PASS';
}catch(error){report.status='FAIL';report.error=error.message;process.exitCode=1;}
finally{
 await db?.end();
 if(created){try{await control.query('DROP DATABASE "'+name+'" WITH (FORCE)');report.cleanup='PASS';}catch(error){report.cleanup='FAIL';report.cleanupError=error.message;process.exitCode=1;}}
 await control.end();fs.writeFileSync('../docs/SYSTEM_BACKUP_RESTORE_20261011.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({status:report.status,tables:Object.keys(report.tableCounts||{}).length,migrations:report.migrations,cleanup:report.cleanup,error:report.error}));
}
