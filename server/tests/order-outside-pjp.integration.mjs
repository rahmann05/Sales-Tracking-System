import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {createOrder} from '../src/modules/orders/services/create-order.service.js';
import {approveOrder} from '../src/modules/orders/services/approve-order.service.js';
import {getOrders} from '../src/modules/orders/services/get-orders.service.js';
import {savePacking} from '../src/modules/delivery/services/packing-workflow.service.js';
import {outletOperationalImpact} from '../src/modules/outlets/services/outlet-operational-impact.service.js';
import {withPolicy} from '../src/modules/config/services/policy-context.service.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag='outside-order-'+randomUUID(),users=[],clusters=[],outlets=[];let product,checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const reject=async(fn,status)=>{await assert.rejects(fn,e=>e.statusCode===status);checks++;};
try{
 const person=async(role,extra={})=>{const p=await prisma.user.create({data:{role,name:tag,email:randomUUID()+'@example.invalid',password:'unused',...extra}});users.push(p);return p;};
 const admin=await person('ADMIN'),spv=await person('SUPERVISOR'),sales=await person('SALES',{supervisorId:spv.id}),other=await person('SALES');
 for(const actor of [sales,other]){const c=await prisma.cluster.create({data:{name:tag,region:'Bandung',supervisorId:actor.supervisorId,assignedSalesId:actor.id}});clusters.push(c.id);const o=await prisma.outlet.create({data:{name:tag,address:'Jl Uji 18 Bandung',clusterId:c.id}});outlets.push(o);}
 product=await prisma.product.create({data:{name:tag,sku:tag,price:100}});
 let values={...CONFIG_DEFAULTS,ORDER_ALLOW_OUTSIDE_PJP:false,ORDER_APPROVAL_MODE:'NONE',PACKING_SOURCE_MODE:'BOTH',PACKING_AUTO_FROM_APPROVED_ORDER:true,CODE_ORDER_MODE:'MANUAL',CODE_PACKING_LIST_MODE:'INCREMENT',CODE_INVOICE_MODE:'MANUAL'};
 const as=fn=>withPolicy({values,versions:[],at:new Date().toISOString()},fn);
 const items=[{productId:product.id,quantity:2,unitPrice:100}];const options={outletId:outlets[0].id,contextReason:'Pelanggan memesan melalui telepon',requestId:randomUUID()};
 await reject(()=>as(()=>createOrder(sales.id,undefined,items,'CASH',tag,options)),403);
 values.ORDER_ALLOW_OUTSIDE_PJP=true;
 await reject(()=>as(()=>createOrder(sales.id,undefined,items,'CASH',tag,{...options,contextReason:''})),422);
 await reject(()=>as(()=>createOrder(sales.id,undefined,items,'CASH',tag,{...options,outletId:outlets[1].id})),403);
 await reject(()=>as(()=>createOrder(admin.id,undefined,items,'CASH',tag,options)),403);
 await reject(()=>as(()=>createOrder(sales.id,randomUUID(),items,'CASH',tag,options)),400);
 const order=await as(()=>createOrder(sales.id,undefined,items,'CASH',tag,options));
 eq(order.pjpStopId,null);eq(order.outletId,outlets[0].id);eq(order.status,'APPROVED');eq(order.customerSnapshot.id,outlets[0].id);eq(order.history[0].contextReason,options.contextReason);
 eq(await prisma.pjp.count({where:{userId:sales.id}}),0);eq(await prisma.attendance.count({where:{userId:sales.id}}),0);
 const draft=await prisma.packingList.findFirst({where:{sourceOrderId:order.id}});eq(draft.outletId,outlets[0].id);
 values.ORDER_ALLOW_OUTSIDE_PJP=false;
 eq((await as(()=>createOrder(sales.id,undefined,items,'CASH',tag,options))).id,order.id);
 await reject(()=>as(()=>createOrder(sales.id,undefined,items,'CASH',tag,{...options,contextReason:'Alasan telah berbeda'})),409);
 eq(await prisma.packingList.count({where:{sourceOrderId:order.id}}),1);
 eq((await getOrders(sales)).data.find(o=>o.id===order.id).context,'OUTLET');
 eq((await getOrders(other)).data.some(o=>o.id===order.id),false);
 eq((await outletOperationalImpact(prisma,outlets[0].id)).orders,1);
 values={...values,ORDER_ALLOW_OUTSIDE_PJP:true,ORDER_APPROVAL_MODE:'BOTH',PACKING_AUTO_FROM_APPROVED_ORDER:false};
 const pending=await as(()=>createOrder(sales.id,undefined,items,'CASH',tag+'-review',{...options,requestId:randomUUID()}));
 eq(pending.status,'PENDING_APPROVAL');eq((await as(()=>approveOrder(pending.id,admin.id))).status,'APPROVED');
 const line=pending.items[0];const pl=await as(()=>savePacking({outletId:outlets[0].id,sourceOrderId:pending.id,items:[{lineId:line.id,sourceOrderItemId:line.id,name:tag,quantity:2,unit:'unit'}],totalCartons:1,invoices:[{invoiceNumber:tag,totalCartons:1,totalAmount:200,items:[{lineId:line.id,quantity:2,unitPrice:100}]}]},admin.id));eq(pl.outletId,outlets[0].id);
 console.log(`Outside PJP order passed: ${checks} assertions; scope, parameters, reason, no fake visits, retry, approval, auto/manual packing and monitoring.`);
}finally{
 const ids=users.map(u=>u.id);
 await prisma.notification.deleteMany({where:{userId:{in:ids}}});await prisma.auditEvent.deleteMany({where:{actorId:{in:ids}}});await prisma.packingList.deleteMany({where:{outletId:{in:outlets.map(o=>o.id)}}});await prisma.order.deleteMany({where:{createdBy:{in:ids}}});
 if(product)await prisma.product.delete({where:{id:product.id}});await prisma.outlet.deleteMany({where:{id:{in:outlets.map(o=>o.id)}}});await prisma.cluster.deleteMany({where:{id:{in:clusters}}});await prisma.user.deleteMany({where:{id:{in:ids}}});await prisma.$disconnect();
}

