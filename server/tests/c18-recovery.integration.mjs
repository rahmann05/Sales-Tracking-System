import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {queueOutletChange} from '../src/modules/outlets/services/outlet-change-queue.service.js';
import {invalidatePolicyCache} from '../src/modules/config/services/policy-resolver.service.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag='c18-recovery-'+randomUUID(),users=[];let cluster,outlet,job,key,checks=0;
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
try{
 const spv=await prisma.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:'unused',role:'SUPERVISOR'}});users.push(spv.id);
 const admin=await prisma.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:'unused',role:'ADMIN',supervisorId:spv.id}});users.push(admin.id);
 cluster=await prisma.cluster.create({data:{name:tag,region:'Uji'}});outlet=await prisma.outlet.create({data:{name:tag,address:'Jalan Uji nomor 12 Bandung',clusterId:cluster.id}});
 job=await queueOutletChange(outlet.id,{updatedAt:outlet.updatedAt.toISOString(),reason:'Usulan data untuk pemulihan fixture',name:'Nama usulan',effectiveAt:new Date(Date.now()+3600000).toISOString()},admin);
 key='_POLICY_PROFILE:TEAM:'+spv.id;
 await prisma.systemConfig.create({data:{key,value:{scope:'TEAM:'+spv.id,revision:1,draft:{},versions:[{id:randomUUID(),revision:1,effectiveAt:new Date(Date.now()-1000).toISOString(),values:{FEATURE_OUTLET_MASTER_MODE:'OFF'}}]}}});invalidatePolicyCache();
 const api=async(path,body)=>{const r=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/outlets/${outlet.id}${path}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt.sign({id:admin.id,tokenVersion:0},config.jwtSecret)},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 eq((await api('/change-queue',{updatedAt:outlet.updatedAt.toISOString(),reason:'Usulan baru tidak boleh dibuat',name:'Baru'})).status,409);
 eq((await api('/change-queue/'+job.id+'/cancel',{reason:'Batalkan usulan lama saat fitur mati'})).status,200);
 eq((await prisma.systemConfig.findUnique({where:{key:'_OUTLET_CHANGE_QUEUE:'+job.id}})).value.state,'CANCELLED');
 eq((await prisma.outlet.findUnique({where:{id:outlet.id}})).name,tag);
 console.log(`C18 recovery API passed: ${checks} assertions; OFF blocks new master proposal but preserves authorized cancellation and original master.`);
}finally{
 await new Promise(r=>server.close(r));await prisma.systemConfig.deleteMany({where:{key:{in:[key,...(job?['_OUTLET_CHANGE_QUEUE:'+job.id]:[])].filter(Boolean)}}});invalidatePolicyCache();
 await prisma.auditEvent.deleteMany({where:{actorId:{in:users}}});if(outlet)await prisma.outlet.delete({where:{id:outlet.id}});if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});
 await prisma.user.deleteMany({where:{id:{in:users}}});await prisma.$disconnect();
}
