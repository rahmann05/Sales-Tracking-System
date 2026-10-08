// Disposable local PostgreSQL fixtures; no external service calls.
import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import jwt from 'jsonwebtoken';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {httpServer} from '../src/app.js';
import {invalidateConfigCache} from '../src/modules/config/services/dynamic-config.service.js';
import {updateProduct} from '../src/modules/products/services/update-product.service.js';
import {createOrder} from '../src/modules/orders/services/create-order.service.js';
import {approveOrder} from '../src/modules/orders/services/approve-order.service.js';
import {cancelOrderRemainder} from '../src/modules/orders/services/cancel-order-remainder.service.js';
import {getOrderById} from '../src/modules/orders/services/get-order-by-id.service.js';
import {savePacking} from '../src/modules/delivery/services/packing-workflow.service.js';
import {withUserTransaction} from '../src/utils/user-transaction.js';
import {refreshAccessToken} from '../src/modules/auth/services/refresh-access-token.service.js';
import {saveConfigs} from '../src/modules/config/services/save-configs.service.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname),'Local database only');
const tag=`VERIFY-INTEGRITY-${randomUUID()}`,userIds=[];let outlet,product,pjp,cluster,checks=0;
const check=(a,b)=>{assert.deepEqual(a,b);checks++;};
const rejects=async(fn,status)=>{await assert.rejects(fn,e=>e.statusCode===status);checks++;};
const original=prisma.systemConfig.findMany;
prisma.systemConfig.findMany=async()=>Object.entries({CODE_ORDER_MODE:'MANUAL',CODE_PACKING_LIST_MODE:'MANUAL',PACKING_SOURCE_MODE:'BOTH',PACKING_AUTO_FROM_APPROVED_ORDER:false,SALES_ALLOW_PRICE_OVERRIDE:false,TAX_RATE_PERCENT:11,ORDER_PRICES_INCLUDE_TAX:false}).map(([key,value])=>({key,value}));invalidateConfigCache();
try{
  const makeUser=async role=>{const u=await prisma.user.create({data:{name:tag,email:`${randomUUID()}@example.invalid`,password:'not-a-login-password',role}});userIds.push(u.id);return u;};
  const admin=await makeUser('ADMIN'),sales=await makeUser('SALES'),other=await makeUser('SALES');
  cluster=await prisma.cluster.create({data:{name:tag,region:'Test'}});
  outlet=await prisma.outlet.create({data:{name:tag,address:'Original address',clusterId:cluster.id,latitude:-6.9,longitude:107.6}});
  product=await prisma.product.create({data:{name:'Original product',sku:tag,price:10000,unit:'dus',baseUnit:'pcs',unitsPerUnit:12}});
  pjp=await prisma.pjp.create({data:{userId:sales.id,date:new Date(),type:'SALES',stops:{create:{outletId:outlet.id,sequence:1}}},include:{stops:true}});
  const stop=pjp.stops[0];await prisma.attendance.create({data:{pjpStopId:stop.id,userId:sales.id,type:'IN',latitude:-6.9,longitude:107.6}});
  const items=[{productId:product.id,quantity:10,unitPrice:10000,unit:'dus',baseUnit:'pcs',unitsPerUnit:12}],requestId=randomUUID();
  await rejects(()=>createOrder(sales.id,stop.id,items,'CASH',tag,{requestId,expectedTotal:100000}),409);
  check(await prisma.order.count({where:{createdBy:sales.id}}),0);
  const submit=()=>createOrder(sales.id,stop.id,items,'CASH',tag,{requestId,expectedTotal:111000,expectedTermDays:0});
  const concurrent=await Promise.all([submit(),submit()]);const order=concurrent[0];check(concurrent[1].id,order.id);check(await prisma.order.count({where:{requestId}}),1);
  await rejects(()=>createOrder(sales.id,stop.id,[{...items[0],quantity:9}],'CASH',tag,{requestId}),409);
  await rejects(()=>createOrder(other.id,stop.id,items,'CASH',tag,{requestId}),409);
  await rejects(()=>createOrder(sales.id,stop.id,[items[0],items[0]],'CASH',tag),400);
  await rejects(()=>createOrder(sales.id,stop.id,[{productId:product.id,quantity:1,unitPrice:10000}],'CASH',`${tag}-missing-unit`),409);
  check(order.items[0].unit,'dus');check(order.items[0].unitsPerUnit,12);
  await updateProduct(product.id,{name:'Renamed product',price:20000,unit:'pack',baseUnit:'pcs',unitsPerUnit:6},admin);
  const unitAudit=await prisma.auditEvent.findFirst({where:{entityType:'PRODUCT',entityId:product.id}});check(unitAudit.before.unitsPerUnit,12);check(unitAudit.after.unitsPerUnit,6);
  await rejects(()=>createOrder(sales.id,stop.id,[{...items[0],unitPrice:20000}],'CASH',`${tag}-stale-unit`),409);
  await prisma.auditEvent.deleteMany({where:{entityType:'PRODUCT',entityId:product.id}});await prisma.outlet.update({where:{id:outlet.id},data:{name:'Renamed customer',address:'New address'}});
  const historical=await getOrderById(order.id,sales);check(historical.items[0].product.name,'Original product');check(historical.items[0].product.unit,'dus');check(historical.items[0].product.unitsPerUnit,12);check(historical.pjpStop.outlet.address,'Original address');check(historical.totalValue,111000);
  await prisma.attendance.create({data:{pjpStopId:stop.id,userId:sales.id,type:'OUT',latitude:-6.9,longitude:107.6}});
  check((await submit()).id,order.id);await rejects(()=>createOrder(sales.id,stop.id,[{...items[0],unitPrice:20000}],'CASH',`${tag}-after`),409);
  await approveOrder(order.id,admin.id);const line=order.items[0];
  const packing=await savePacking({code:tag,sourceOrderId:order.id,outletId:outlet.id,items:[{lineId:line.id,sourceOrderItemId:line.id,name:'Original product',quantity:6,unit:'unit'}],totalCartons:1,invoices:[]},admin.id);
  check(packing.items[0].unit,'dus');check(packing.items[0].unitsPerUnit,12);
  await rejects(()=>cancelOrderRemainder(order.id,{note:'Too much',lines:[{id:line.id,quantity:5}]},admin),409);
  await rejects(()=>cancelOrderRemainder(order.id,{note:'Not admin',lines:[{id:line.id,quantity:1}]},sales),403);
  const cancelled=await cancelOrderRemainder(order.id,{note:'Customer reduced demand',lines:[{id:line.id,quantity:4}]},admin);check(cancelled.fulfillmentLines[0].cancelled,4);check(cancelled.fulfillmentLines[0].unpacked,0);check(cancelled.fulfillmentLines[0].remaining,6);
  await rejects(()=>cancelOrderRemainder(order.id,{note:'Repeated',lines:[{id:line.id,quantity:1}]},admin),409);
  await rejects(()=>savePacking({code:`${tag}-excess`,sourceOrderId:order.id,outletId:outlet.id,items:[{lineId:line.id,sourceOrderItemId:line.id,name:'Original product',quantity:1,unit:'unit'}],totalCartons:1,invoices:[]},admin.id),409);
  check((await prisma.order.findUnique({where:{id:order.id}})).history.map(h=>h.action),['CREATE','APPROVE','CANCEL_REMAINDER']);
  await prisma.packingList.delete({where:{id:packing.id}});
  // Exercise real config writes and audit inserts, then roll back every setting change.
  const transact=prisma.$transaction,rollback=new Error('Intentional config test rollback');
  await assert.rejects(()=>transact.call(prisma,async tx=>{
    const before=await tx.systemConfig.findUnique({where:{key:'TAX_RATE_PERCENT'}}),next=before?.value===15?14:15;
    prisma.$transaction=work=>work(tx);
    try{await saveConfigs({TAX_RATE_PERCENT:next},admin);const event=await tx.auditEvent.findFirst({where:{actorId:admin.id,entityId:'TAX_RATE_PERCENT'}});check(event.after.value,next);check(event.actorName,admin.name);}finally{prisma.$transaction=transact;}
    throw rollback;
  }),e=>e===rollback);
  check(await prisma.auditEvent.count({where:{actorId:admin.id}}),0);
  // An order attempt waiting behind checkout must observe OUT after the lock is released.
  await prisma.attendance.deleteMany({where:{pjpStopId:stop.id,type:'OUT'}});
  let release,entered;const ready=new Promise(resolve=>{entered=resolve;}),gate=new Promise(resolve=>{release=resolve;});
  const checkout=withUserTransaction(sales.id,async tx=>{entered();await gate;await tx.attendance.create({data:{pjpStopId:stop.id,userId:sales.id,type:'OUT',latitude:-6.9,longitude:107.6}});});
  await ready;const racing=createOrder(sales.id,stop.id,[{...items[0],unitPrice:20000}],'CASH',`${tag}-race`);const blocked=rejects(()=>racing,409);release();await checkout;await blocked;
  await new Promise(resolve=>httpServer.listen(0,'127.0.0.1',resolve));const root=`http://127.0.0.1:${httpServer.address().port}/api/v1`;
  const token=jwt.sign({id:sales.id,tokenVersion:0},config.jwtSecret,{expiresIn:'5m'}),refresh=jwt.sign({id:sales.id,tokenVersion:0},config.jwtRefreshSecret,{expiresIn:'5m'});
  const send=(path,method='GET')=>fetch(root+path,{method,headers:{Authorization:`Bearer ${token}`}});
  check((await send('/config/history')).status,403);
  const adminHistory=await fetch(root+'/config/history',{headers:{Authorization:`Bearer ${jwt.sign({id:admin.id},config.jwtSecret,{expiresIn:'5m'})}`}});check(adminHistory.status,200);assert.ok(Array.isArray((await adminHistory.json()).data.data));checks++;
  check((await send(`/orders/requests/${requestId}`)).status,200);check((await send('/auth/logout','POST')).status,200);check((await send('/auth/me')).status,401);await rejects(()=>refreshAccessToken(refresh),401);
  console.log(`Order integrity integration: ${checks} checks passed (concurrent retries, tax guard, snapshots, checkout race, cancellations and session revocation).`);
}finally{
  if(httpServer.listening)await new Promise(resolve=>httpServer.close(resolve));
  prisma.systemConfig.findMany=original;invalidateConfigCache();
  await prisma.auditEvent.deleteMany({where:{actorId:{in:userIds}}});
  await prisma.notification.deleteMany({where:{OR:[{userId:{in:userIds}},...userIds.map(id=>({payload:{path:['salesId'],equals:id}}))]}});
  await prisma.packingList.deleteMany({where:{createdById:{in:userIds}}});
  await prisma.order.deleteMany({where:{createdBy:{in:userIds}}});if(pjp)await prisma.pjp.delete({where:{id:pjp.id}});if(outlet)await prisma.outlet.delete({where:{id:outlet.id}});if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});if(product)await prisma.product.delete({where:{id:product.id}});await prisma.user.deleteMany({where:{id:{in:userIds}}});await prisma.$disconnect();
}
