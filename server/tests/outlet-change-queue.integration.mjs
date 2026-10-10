import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Prisma} from '@prisma/client';
import {prisma} from '../src/config/prisma.js';
import {queueOutletChange,runOutletChanges,cancelOutletChange,listOutletChanges} from '../src/modules/outlets/services/outlet-change-queue.service.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag='queue-'+randomUUID(),users=[],jobs=[];let cluster,outlet,pjp,checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const reject=async(fn,status)=>{await assert.rejects(fn,e=>e.statusCode===status);checks++;};
try{
 const person=async role=>{const u=await prisma.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:'unused',role}});users.push(u.id);return u;};
 const admin=await person('ADMIN'),sales=await person('SALES'),foreign=await person('SUPERVISOR');
 cluster=await prisma.cluster.create({data:{name:tag,region:'Bandung',assignedSalesId:sales.id}});
 outlet=await prisma.outlet.create({data:{name:tag,address:'Jalan Uji nomor 12 Bandung',latitude:-6.9,longitude:107.6,clusterId:cluster.id}});
 const body=async extra=>({updatedAt:(await prisma.outlet.findUnique({where:{id:outlet.id}})).updatedAt.toISOString(),reason:'Perbaikan data master terkonfirmasi',...extra});
 const create=async extra=>{const j=await queueOutletChange(outlet.id,await body(extra),admin);jobs.push(j.id);return j;};
 const state=async j=>(await prisma.systemConfig.findUnique({where:{key:'_OUTLET_CHANGE_QUEUE:'+j.id}})).value.state;
 await reject(()=>queueOutletChange(outlet.id,{...{updatedAt:outlet.updatedAt.toISOString(),reason:'Perbaikan nama outlet lama'},name:'Baru'},foreign),403);
 const future=await create({name:'Toko Baru',effectiveAt:new Date(Date.now()+3600000).toISOString()});
 await runOutletChanges(Date.now(),{ids:[future.id]});eq(await state(future),'PENDING');
 await reject(()=>create({name:'Duplikat'}),409);
 await cancelOutletChange(outlet.id,future.id,'Ganti waktu penerapan',admin);eq(await state(future),'CANCELLED');
 pjp=await prisma.pjp.create({data:{userId:sales.id,type:'SALES',date:new Date(),stops:{create:{outletId:outlet.id,sequence:1,visitSession:{state:'ACTIVE'}}}},include:{stops:true}});
 const waiting=await create({latitude:-6.91,longitude:107.61});
 await runOutletChanges(Date.now(),{ids:[waiting.id]});eq(await state(waiting),'PENDING');eq((await prisma.outlet.findUnique({where:{id:outlet.id}})).latitude,-6.9);
 await prisma.pjpStop.update({where:{id:pjp.stops[0].id},data:{visitSession:Prisma.DbNull}});
 await Promise.all([runOutletChanges(Date.now(),{ids:[waiting.id]}),runOutletChanges(Date.now(),{ids:[waiting.id]})]);
 eq(await state(waiting),'APPLIED');eq((await prisma.outlet.findUnique({where:{id:outlet.id}})).latitude,-6.91);eq(await prisma.outletChange.count({where:{outletId:outlet.id}}),1);
 const stale=await create({name:'Nama dari usulan lama'});
 await prisma.outlet.update({where:{id:outlet.id},data:{name:'Nama terbaru'}});
 await runOutletChanges(Date.now(),{ids:[stale.id]});eq(await state(stale),'FAILED');eq((await prisma.outlet.findUnique({where:{id:outlet.id}})).name,'Nama terbaru');
 const revoked=await create({phone:'081234567890'});
 await prisma.user.update({where:{id:admin.id},data:{permissions:{can_manage_outlets:false}}});
 await runOutletChanges(Date.now(),{ids:[revoked.id]});eq(await state(revoked),'FAILED');
 await reject(()=>listOutletChanges(outlet.id,admin),403);
 console.log(`Outlet change queue passed: ${checks} assertions; timing, busy work, concurrency, stale master and fresh permission.`);
}finally{
 await prisma.systemConfig.deleteMany({where:{key:{in:jobs.map(id=>'_OUTLET_CHANGE_QUEUE:'+id)}}});
 await prisma.auditEvent.deleteMany({where:{actorId:{in:users}}});
 if(pjp)await prisma.pjp.delete({where:{id:pjp.id}});
 if(outlet){await prisma.outletChange.deleteMany({where:{outletId:outlet.id}});await prisma.outlet.delete({where:{id:outlet.id}});}
 if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});
 await prisma.user.deleteMany({where:{id:{in:users}}});await prisma.$disconnect();
}
