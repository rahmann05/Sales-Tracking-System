import 'dotenv/config';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PrismaClient} from '@prisma/client';
import {assertDemoDatabase} from '../prisma/seeds/context.js';
import {verifyBelfoods,snapshot,digest} from '../prisma/belfoods/verify.js';
assertDemoDatabase();
const db=new PrismaClient();
const run=()=>{const result=spawnSync(process.execPath,['prisma/seed.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8',timeout:120000});assert.equal(result.status,0,result.stderr||result.stdout);};
try {
 const metadata=await db.systemConfig.findUnique({where:{key:'BELFOODS_UAT_SEED'}});assert.ok(metadata,'Run guarded reset first');
 const before=await snapshot(db);run();const first=await snapshot(db);run();const second=await snapshot(db);
 assert.equal(digest(first),digest(before),'Rerun must preserve every existing row, password, timestamp and user decision');
 assert.equal(digest(second),digest(first),'Two runs must be identical');
 const report=await verifyBelfoods(db,metadata.value.date,{exact:true});
 console.log(JSON.stringify({idempotence:'PASS: two runs, all persisted rows unchanged',...report},null,2));
}finally{await db.$disconnect();}
