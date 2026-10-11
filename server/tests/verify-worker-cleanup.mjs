import fs from 'node:fs';
import dotenv from 'dotenv';
import assert from 'node:assert/strict';
import {PrismaClient} from '@prisma/client';
assert.ok(process.argv.includes('--approved-production'));
const results=[];
for(const environment of ['LOCAL','PRODUCTION']){
 const env=dotenv.parse(fs.readFileSync(environment==='LOCAL'?'.env':'.env.production'));
 const url=new URL(env.DIRECT_URL||env.DATABASE_URL);
 assert.ok(environment==='LOCAL'?['localhost','127.0.0.1','[::1]'].includes(url.hostname):url.hostname.endsWith('.neon.tech'));
 if(environment==='PRODUCTION')url.searchParams.set('sslmode','verify-full');
 const db=new PrismaClient({datasources:{db:{url:url.toString()}}});
 try{
  const counts={users:await db.user.count({where:{name:{startsWith:'UAT-WORKER-'}}}),plans:await db.pjpPlan.count({where:{name:{startsWith:'UAT-WORKER-'}}}),outlets:await db.outlet.count({where:{name:{contains:'UAT-WORKER-'}}}),clusters:await db.cluster.count({where:{name:{startsWith:'UAT-WORKER-'}}})};
  results.push({environment,counts,clean:Object.values(counts).every(n=>n===0)});
 }finally{await db.$disconnect();}
}
fs.writeFileSync('../docs/SYSTEM_WORKER_CLEANUP_20261011.json',JSON.stringify({at:new Date().toISOString(),results},null,2)+'\n');
console.log(JSON.stringify(results));assert.ok(results.every(row=>row.clean));
