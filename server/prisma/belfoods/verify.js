import assert from 'node:assert/strict';
import {Prisma} from '@prisma/client';
import {createHash} from 'node:crypto';
import {CONFIG_PARAMS} from '../../../shared/config.mjs';
import {packingBalance} from '../../../shared/packing.mjs';
import {invoiceReconciliation} from '../../../shared/invoice-reconciliation.mjs';
import {visitSalesResult} from '../../../shared/visit-metrics.mjs';
import {id,sourceData,people} from './context.js';
export const models=Prisma.dmmf.datamodel.models.map(m=>({name:m.name,table:m.dbName||m.name,client:m.name[0].toLowerCase()+m.name.slice(1),key:m.fields.find(f=>f.isId).name}));
export async function snapshot(db){
 const result={};for(const m of models)result[m.client]=await db[m.client].findMany({orderBy:{[m.key]:'asc'}});return result;
}
export const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export async function verifyBelfoods(db,date,{exact=false}={}){
 const data=sourceData(),users=await db.user.findMany(),outlets=await db.outlet.findMany({include:{cluster:true}}),counts={};
 for(const m of models)counts[m.name]=await db[m.client].count();
 if(exact){assert.equal(users.length,11);assert.equal(outlets.length,20);assert.equal(counts.Order,8);assert.equal(counts.PackingList,5);assert.equal(counts.DeliveryRoute,3);assert.equal(counts.PjpStop,39);assert.equal(counts.Pjp,10);assert.equal(counts.Cluster,5);}
 for(const role of ['ADMIN','SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR'])assert.ok(users.some(u=>u.role===role),role);
 for(const row of data.outlets){
  const actual=outlets.find(o=>o.outletCode===row.customer_id);assert.ok(actual,row.customer_id);
  assert.equal(actual.name,row.customer_name.trim());assert.equal(actual.address,row.address.trim());assert.equal(actual.latitude,row.latitude);assert.equal(actual.longitude,row.longitude);
  assert.equal(actual.validationStatus,'UNVALIDATED');assert.equal(actual.validatedAt,null);assert.equal(actual.validationConfidence,null);assert.equal(actual.phone,null);
  assert.equal(actual.cluster.assignedSalesId,users.find(u=>u.staffCode===row.sales.split(' ')[0]).id);
 }
 for(const member of users.filter(u=>u.role==='SALES')){assert.ok(member.clusterId&&member.supervisorId);assert.equal(outlets.filter(o=>o.cluster.assignedSalesId===member.id).length,4);}
 for(const param of CONFIG_PARAMS)assert.ok(await db.systemConfig.findUnique({where:{key:param.key}}),param.key);
 const registrations=await db.customerRegistration.findMany();assert.deepEqual(new Set(registrations.map(r=>r.registrationStatus)),new Set(['DRAFT','SUBMITTED','SPV_APPROVED','REJECTED']));
 assert.equal(counts.OutletValidationRun,0,'No invented provider runs');assert.equal(counts.SalesLivePosition,0);assert.equal(counts.DeliveryPosition,0);
 assert.equal(counts.NotificationOutbox,0,'Seed notices are historical inbox messages, not live broadcasts');
 const stops=await db.pjpStop.findMany({include:{orders:{include:{items:true}},attendances:true}});
 for(const stop of stops){const report=visitSalesResult(stop),approved=stop.orders.filter(o=>o.status==='APPROVED');assert.equal(report.orderAmount,approved.reduce((n,o)=>n+o.totalValue,0));}
 const orders=await db.order.findMany({include:{items:true,pjpStop:true}});
 for(const order of orders){assert.equal(order.totalValue,order.items.reduce((n,i)=>n+i.subtotal,0));assert.equal(order.createdBy,users.find(u=>u.id===order.createdBy)?.id);}
 const packings=await db.packingList.findMany({include:{invoices:true,deliveryStops:true}});
 for(const packing of packings){
  const balance=packingBalance(packing);assert.ok(balance.remainingCartons>=0);assert.ok(balance.remainingItems.every(i=>i.remaining>=0));assert.ok(balance.remainingInvoices.every(i=>i.remaining>=0));
  if(packing.sourceOrderId){const order=orders.find(o=>o.id===packing.sourceOrderId);assert.equal(order.status,'APPROVED');assert.equal(order.pjpStop.outletId,packing.outletId);for(const item of packing.items)assert.equal(order.items.find(i=>i.id===item.lineId)?.quantity,item.quantity);}
  for(const invoice of packing.invoices)assert.equal(invoice.outletId,packing.outletId);
  const reconciliation=invoiceReconciliation(packing);assert.deepEqual(reconciliation.errors,[]);assert.ok(reconciliation.invoices.every(i=>i.difference===0),'Invoice amounts must match mapped lines');
 }
 const missing=await db.operationalException.findUnique({where:{id:id(`missing-${id(`stop-SLD516-${date}-1`)}`)}});assert.ok(missing);assert.equal(missing.kind,'MISSING_OUT');
 assert.equal(await db.attendance.count({where:{pjpStopId:missing.entityId,type:'OUT'}}),0);
 assert.ok(await db.staffActivity.findFirst({where:{kind:'COLLECTION_FOLLOW_UP'}}));
 assert.equal(await db.product.count({where:{stock:{not:0}}}),0,'No inventory seed');
 assert.equal(people.length,11);
 return {date,counts,sourceOutlets:data.outlets.length,status:'PASS'};
}
