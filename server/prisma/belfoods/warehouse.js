import {at,offsetDate} from '../seeds/context.js';
import {ensure,id,note,fixturePolicy} from './context.js';

export async function seedWarehouse(db,master,salesData,date){
 const {users,vehicles,groups,products}=master,approved=salesData.orders.filter(o=>o.status==='APPROVED'),packing=[];
 for(const [index,key] of ['draft','ready','transit-done','transit-pending','return'].entries()){
  const order=index?approved[index-1]:null,orderItems=order?await db.orderItem.findMany({where:{orderId:order.id}}):[],product=products[0];
  const outletId=order?(await db.pjpStop.findUnique({where:{id:order.pjpStopId}})).outletId:groups[1][2].id;
  const items=order?orderItems.map(i=>({lineId:i.id,productId:i.productId,sku:i.productSku,name:i.productName,unit:i.unit,quantity:i.quantity})): [{lineId:id('manual-line'),productId:product.id,sku:product.sku,name:product.name,unit:'pak',quantity:8}];
  const terminal=key==='return',day=terminal?offsetDate(date,-1):date,amount=order?.totalValue??product.price*8;
  const record=await ensure(db,'packingList',`packing-${key}-${date}`,{code:`UJI-BF-PL-${key}-${date}`,outletId,createdById:users.admin.id,status:index?'RELEASED':'DRAFT',source:order?'ORDER':'MANUAL',sourceOrderId:order?.id||null,items,totalCartons:4,totalWeight:20,notes:note,createdAt:at(day,'07:30'),releasedAt:index?at(day,'07:40'):null,revision:index?2:1,policySnapshot:fixturePolicy(day),history:[{action:'SEED_SIMULATION',userId:users.admin.id,at:at(day,'07:30').toISOString(),note}],invoices:{create:[{id:id(`invoice-${key}-${date}`),invoiceNumber:`UJI-BF-INV-${key}-${date}`,outletId,totalCartons:4,totalAmount:amount,taxRatePercent:0,taxIncluded:false,isDelivered:key==='transit-done',deliveredAt:key==='transit-done'?at(day,'09:20'):null,items:items.map(i=>({...i,unitPrice:orderItems.find(o=>o.id===i.lineId)?.unitPrice||product.price})),notes:note}]}});
  const invoice=await db.invoice.findUnique({where:{id:id(`invoice-${key}-${date}`)}});packing.push({...record,invoice});
 }
 const prep=(day,key,indexes)=>Object.fromEntries(['PICK','CHECK','LOAD'].map(stage=>[stage,{actorId:users.gudang.id,actorName:users.gudang.name,at:at(day,'07:50').toISOString(),note,cartons:indexes.length*4,quantities:Object.fromEntries(indexes.flatMap(index=>packing[index].items.map(item=>[`${id(`delivery-stop-${key}-${index}-${date}`)}:${item.lineId}`,item.quantity])))}]));
 for(const [key,indexes,vehicleIndex,driverKey,status] of [['ready',[1],0,'supir-1','READY'],['transit',[2,3],1,'supir-2','IN_TRANSIT'],['return',[4],0,'supir-1','PARTIAL']]){
  const returned=key==='return',day=returned?offsetDate(date,-1):date;
  const route=await ensure(db,'deliveryRoute',`route-${key}-${date}`,{code:`UJI-BF-TRIP-${key}-${date}`,date:at(day,'00:00'),vehicleId:vehicles[vehicleIndex].id,driverId:users[driverKey].id,createdById:users.gudang.id,status,totalCartons:indexes.length*4,totalWeight:indexes.length*20,notes:note,plannedStartAt:at(day,'08:00'),plannedEndAt:at(day,'16:00'),policySnapshot:fixturePolicy(day),preparation:prep(day,key,indexes),history:[{action:'SEED_SIMULATION',actorId:users.gudang.id,at:at(day,'08:00').toISOString(),note}],...(status!=='READY'?{departedAt:at(day,'08:00'),odometerStart:1100}:{}),...(returned?{returnedAt:at(day,'13:00'),odometerEnd:1150,actualDistanceKm:50}:{}),createdAt:at(day,'07:45')});
  for(const [sequence,index] of indexes.entries()){
   const p=packing[index],delivered=key==='transit'&&sequence===0,arrived=key!=='ready';
   const stop=await ensure(db,'deliveryStop',`delivery-stop-${key}-${index}-${date}`,{deliveryRouteId:route.id,packingListId:p.id,outletId:p.outletId,sequence:sequence+1,status:returned?'PARTIAL_REJECT':delivered?'DELIVERED':'PENDING',allocatedCartons:4,allocatedWeight:20,allocatedItems:p.items.map(i=>({lineId:i.lineId,quantity:i.quantity})),allocatedInvoices:[{invoiceId:p.invoice.id,cartons:4}],notes:note,...(arrived?{arrivedAt:at(day,sequence?'10:00':'09:00')}:{}),...(delivered||returned?{completedAt:at(day,'09:20')}:{}),...(returned?{rejectReason:'Uji: satu karton kemasan rusak',rejectedCartons:1,rejectedItems:[{lineId:p.items[0].lineId,quantity:2}],rejectedInvoices:[{invoiceId:p.invoice.id,cartons:1}]}:{})});
   if(arrived)await ensure(db,'deliveryAttendance',`delivery-in-${stop.id}`,{deliveryStopId:stop.id,driverId:users[driverKey].id,type:'IN',timestamp:stop.arrivedAt,notes:note,gpsEvidence:{source:'SEED_SIMULATION'}});
   if(delivered||returned)await ensure(db,'deliveryAttendance',`delivery-out-${stop.id}`,{deliveryStopId:stop.id,driverId:users[driverKey].id,type:'OUT',timestamp:stop.completedAt,notes:note,gpsEvidence:{source:'SEED_SIMULATION'}});
  }
 }
 await ensure(db,'deliveryIssue',`return-issue-${date}`,{routeId:id(`route-return-${date}`),packingListId:packing[4].id,stopId:id(`delivery-stop-return-4-${date}`),title:'Periksa retur kemasan (Uji Belfoods)',reason:'Skenario uji satu karton ditolak; belum diterima atau dinyatakan dapat dikirim ulang.',ownerId:users.gudang.id,createdById:users['supir-1'].id,dueAt:at(date,'17:00'),history:[{action:'SEED_SIMULATION',at:at(offsetDate(date,-1),'13:00').toISOString(),note}]});
 return packing;
}
