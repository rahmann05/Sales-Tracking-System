import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {ORDER_OPERATION_PERMISSIONS} from '../../shared/order-operation-permissions.mjs';
import {saveOrderReviewAssignment} from '../src/modules/orders/services/order-review-assignment.service.js';
import {setOrderPromise} from '../src/modules/orders/services/order-promise.service.js';
import {cancelOrderRemainder} from '../src/modules/orders/services/cancel-order-remainder.service.js';
import {assignmentSchedulePreview,createAssignmentSchedule,runAssignmentSchedules,cancelAssignmentSchedule,retryAssignmentSchedule} from '../src/modules/config/services/assignment-schedules.service.js';
import {withPolicy} from '../src/modules/config/services/policy-context.service.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname),'Local fixtures only');
const tag='order-permissions-'+randomUUID(),roleCode='TEST_ORDER_'+randomUUID().replaceAll('-','').toUpperCase(),users=[],orders=[],jobs=[];
let cluster,outlet,product,customAdded=false,checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;},reject=async(fn,status)=>{await assert.rejects(fn,e=>e.statusCode===status);checks++;};
const iso=offset=>new Date(Date.now()+offset).toISOString(),run=fn=>withPolicy({values:{...CONFIG_DEFAULTS,FEATURE_NOTIFICATIONS_MODE:'OFF'}},fn);
const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const token=user=>jwt.sign({id:user.id},config.jwtSecret);
const api=async(user,path,body,method='PATCH',auth=token(user))=>{const response=await fetch(`http://127.0.0.1:${server.address().port}/api/v1${path}`,{method,headers:{Authorization:'Bearer '+auth,'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:response.status,data:await response.json()};};
const readJob=async job=>(await prisma.systemConfig.findUnique({where:{key:'_ASSIGNMENT_SCHEDULE:'+job.id}})).value;
try{
 const person=async(role,extra={})=>{const user=await prisma.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:'unused',role,...extra}});users.push(user.id);return user;};
 const admin=await person('ADMIN'),reviewer=await person('ADMIN'),sales=await person('SALES');
 cluster=await prisma.cluster.create({data:{name:tag,region:'Uji'}});
 outlet=await prisma.outlet.create({data:{name:tag,address:'Jl Uji No 1 Bandung',clusterId:cluster.id}});
 product=await prisma.product.create({data:{name:tag,sku:tag,price:100}});
 const makeOrder=async(status='PENDING_APPROVAL')=>{const order=await prisma.order.create({data:{createdBy:sales.id,outletId:outlet.id,totalValue:200,status,policySnapshot:{values:{...CONFIG_DEFAULTS,ORDER_ALLOW_CANCEL_REMAINDER:true}},items:{create:{productId:product.id,quantity:2,unitPrice:100,subtotal:200}}},include:{items:true}});orders.push(order.id);return order;};
 const pending=await makeOrder(),approved=await makeOrder('APPROVED');
 const promise={promisedAt:iso(86400000),note:'Konfirmasi pengiriman pelanggan'},cancel={note:'Pelanggan mengurangi pesanan',lines:[{id:approved.items[0].id,quantity:1}]},assignment={ownerId:reviewer.id,dueAt:iso(3600000),revision:0,reason:'Pemeriksaan oleh petugas pengganti'};
 const calls=[['PROMISE',`/orders/${approved.id}/promise`,promise,'PATCH'],['CANCEL_REMAINDER',`/orders/${approved.id}/cancel-remainder`,cancel,'PATCH'],['ASSIGN_REVIEW',`/orders/${pending.id}/review-assignment`,assignment,'PUT']];
 const sameToken=token(admin);
 for(const [action,path,body,method] of calls){
  const key=ORDER_OPERATION_PERMISSIONS[action].key;
  await prisma.user.update({where:{id:admin.id},data:{permissions:{[key]:false}}});
  eq((await api(admin,path,body,method,sameToken)).status,403);
 }
 eq((await prisma.order.findUnique({where:{id:approved.id}})).history,[]);
 eq((await prisma.orderItem.findUnique({where:{id:approved.items[0].id}})).cancelledQuantity,0);
 eq(await prisma.systemConfig.findUnique({where:{key:'_ORDER_REVIEW:'+pending.id}}),null);
 await reject(()=>setOrderPromise(approved.id,promise,{...admin,permissions:{can_set_order_promise:false}}),403);
 await reject(()=>cancelOrderRemainder(approved.id,cancel,{...admin,permissions:{can_cancel_order_remainder:false}}),403);
 await reject(()=>saveOrderReviewAssignment(pending.id,assignment,{...admin,permissions:{can_assign_order_review:false}}),403);
 for(const role of ['SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR']){
  const outsider=await person(role,{permissions:Object.fromEntries(Object.values(ORDER_OPERATION_PERMISSIONS).map(p=>[p.key,true]))});
  for(const [,path,body,method] of calls)eq((await api(outsider,path,body,method)).status,403);
 }
 // Custom Admin templates must honor explicit denials just like built-in Admin.
 const existing=(await prisma.systemConfig.findUnique({where:{key:'ROLE_DEFINITIONS'}}))?.value||[];
 const custom={code:roleCode,name:'Test restricted Admin',baseRole:'ADMIN',isSystem:false,defaultPermissions:Object.fromEntries(Object.values(ORDER_OPERATION_PERMISSIONS).map(p=>[p.key,false]))};
 await prisma.systemConfig.upsert({where:{key:'ROLE_DEFINITIONS'},create:{key:'ROLE_DEFINITIONS',value:[...existing,custom]},update:{value:[...existing,custom]}});customAdded=true;
 const restricted=await person('ADMIN',{roleCode});
 for(const [,path,body,method] of calls)eq((await api(restricted,path,body,method)).status,403);
 await prisma.user.update({where:{id:admin.id},data:{permissions:{can_cancel_order_remainder:false,can_assign_order_review:false}}});
 eq((await api(admin,calls[0][1],promise,'PATCH',sameToken)).status,200);
 eq((await prisma.order.findUnique({where:{id:approved.id}})).history.at(-1).action,'PROMISE');
 await prisma.user.update({where:{id:admin.id},data:{permissions:{can_set_order_promise:false,can_assign_order_review:false}}});
 eq((await api(admin,calls[1][1],cancel,'PATCH',sameToken)).status,200);
 eq((await prisma.orderItem.findUnique({where:{id:approved.items[0].id}})).cancelledQuantity,1);
 await prisma.user.update({where:{id:admin.id},data:{permissions:{can_set_order_promise:false,can_cancel_order_remainder:false}}});
 eq((await api(admin,calls[2][1],assignment,'PUT',sameToken)).status,200);
 eq((await prisma.systemConfig.findUnique({where:{key:'_ORDER_REVIEW:'+pending.id}})).value.ownerId,reviewer.id);
 const scheduled=await makeOrder(),preview=await assignmentSchedulePreview('ORDER_REVIEW',scheduled.id,admin);
 const job=await run(()=>createAssignmentSchedule({kind:'ORDER_REVIEW',entityId:scheduled.id,fingerprint:preview.fingerprint,ownerId:reviewer.id,dueAt:iso(3600000),startsAt:iso(1000),endsAt:iso(60000),reason:'Uji pencabutan izin sebelum jadwal berjalan'},admin));jobs.push(job.id);
 await prisma.user.update({where:{id:admin.id},data:{permissions:{can_assign_order_review:false}}});
 const denied={...admin,permissions:{can_assign_order_review:false}};
 await reject(()=>assignmentSchedulePreview('ORDER_REVIEW',scheduled.id,denied),403);
 await reject(()=>cancelAssignmentSchedule(job.id,'Pembatalan tanpa izin penugasan',denied),403);
 await runAssignmentSchedules(Date.now()+2000,{ids:[job.id]});eq((await readJob(job)).state,'FAILED');
 eq(await prisma.systemConfig.findUnique({where:{key:'_ORDER_REVIEW:'+scheduled.id}}),null);
 await reject(()=>retryAssignmentSchedule(job.id,'Ulang tanpa izin penugasan',denied),403);
 await prisma.user.update({where:{id:admin.id},data:{permissions:{}}});
 await retryAssignmentSchedule(job.id,'Izin telah dipulihkan untuk pengujian',admin);
 await runAssignmentSchedules(Date.now()+2000,{ids:[job.id]});eq((await readJob(job)).state,'ACTIVE');
 await runAssignmentSchedules(Date.now()+120000,{ids:[job.id]});eq((await readJob(job)).state,'RESTORED');
 console.log(`Order operation permissions passed: ${checks} assertions; HTTP/direct denial, all role boundaries, custom Admin, same-session permission refresh, independent grants and scheduled-worker revocation/restoration.`);
}finally{
 await prisma.systemConfig.deleteMany({where:{key:{in:[...orders.map(id=>'_ORDER_REVIEW:'+id),...jobs.map(id=>'_ASSIGNMENT_SCHEDULE:'+id)]}}});
 await prisma.auditEvent.deleteMany({where:{actorId:{in:users}}});await prisma.notification.deleteMany({where:{userId:{in:users}}});
 await prisma.order.deleteMany({where:{id:{in:orders}}});if(product)await prisma.product.delete({where:{id:product.id}});if(outlet)await prisma.outlet.delete({where:{id:outlet.id}});
 if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});
 await prisma.user.deleteMany({where:{id:{in:users}}});
 if(customAdded){const current=(await prisma.systemConfig.findUnique({where:{key:'ROLE_DEFINITIONS'}}))?.value||[],remaining=current.filter(r=>r.code!==roleCode);if(remaining.length)await prisma.systemConfig.update({where:{key:'ROLE_DEFINITIONS'},data:{value:remaining}});else await prisma.systemConfig.delete({where:{key:'ROLE_DEFINITIONS'}});}
 await new Promise(resolve=>server.close(resolve));await prisma.$disconnect();
}
