import { seedId as baseSeedId, at, offsetDate } from './context.js';
export async function seedWarehouse(db, master, dateKey, namespace='') {
  const seedId=key=>baseSeedId(namespace+key);
  const prefix=namespace?`DEMO-${namespace}-`:'DEMO-';
  const {admin,warehouse,drivers,vehicles,outlets,products}=master;
  const approved=namespace?null:await db.order.findFirst({where:{createdBy:master.sales[0].id,status:'APPROVED',pjpStop:{pjp:{date:{gte:at(dateKey,'00:00'),lt:at(offsetDate(dateKey,1),'00:00')}}}},orderBy:{createdAt:'asc'},include:{pjpStop:true}});
  const packings={};
  for (const [index,scenario] of ['draft','reference','queue','split','single','delivered','return-received','return-pending'].entries()) {
    const released=!['draft','reference'].includes(scenario);
    const packingDay=['delivered','return-received','return-pending'].includes(scenario)?offsetDate(dateKey,-1):dateKey;
    const outletId=scenario==='reference'&&approved?approved.pjpStop.outletId:outlets[0][index].id;
    const cartons=scenario==='split'?12:6;
    const lineId=seedId(`packing-line-${scenario}-${dateKey}`);
    const items=[{lineId,sku:products[0].sku,name:products[0].name,unit:'pak',quantity:cartons*2}];
    const history=[{action:'CREATE',userId:admin.id,at:at(packingDay).toISOString(),source:'DEMO',after:{items,totalCartons:cartons}},...(released?[{action:'RELEASE',userId:admin.id,at:at(packingDay,'08:15').toISOString()}]:[])];
    packings[scenario]=await db.packingList.upsert({where:{code:`${prefix}PL-${scenario}-${dateKey}`},update:{},create:{id:seedId(`packing-${scenario}-${dateKey}`),code:`${prefix}PL-${scenario}-${dateKey}`,outletId,createdById:admin.id,status:released?'RELEASED':'DRAFT',source:scenario==='reference'&&approved?'MANUAL_REFERENCE':'MANUAL',sourceOrderId:scenario==='reference'?approved?.id:null,totalCartons:cartons,totalWeight:cartons*5,items,history,revision:released?2:1,createdAt:at(packingDay),releasedAt:released?at(packingDay,'08:15'):null,notes:'Data demo; admin menyusun packing secara manual.',invoices:{create:[{id:seedId(`invoice-${scenario}-${dateKey}`),invoiceNumber:`${prefix}INV-${scenario}-${dateKey}`,outletId,totalAmount:cartons*2*products[0].price,totalCartons:cartons,isDelivered:scenario==='delivered',deliveredAt:scenario==='delivered'?at(offsetDate(dateKey,-1),'11:00'):null}]}}});
  }
  const scenarios=[['split-a','split',0,0,'READY','PENDING',6,false],['split-b','split',1,1,'IN_TRANSIT','PENDING',6,false],['single','single',0,0,'DRAFT','PENDING',6,false],['delivered','delivered',0,0,'COMPLETED','DELIVERED',6,false],['return-received','return-received',1,1,'PARTIAL','PARTIAL_REJECT',6,true],['return-pending','return-pending',0,0,'PARTIAL','PARTIAL_REJECT',6,false]];
  for (const [scenario,packingKey,v,d,status,stopStatus,cartons,received] of scenarios) {
    const packing=packings[packingKey],terminal=['COMPLETED','PARTIAL'].includes(status);
    const day=terminal?offsetDate(dateKey,-1):scenario==='single'?offsetDate(dateKey,1):dateKey;
    const key=`delivery-${scenario}-${dateKey}`;
    const items=[{lineId:packing.items[0].lineId,quantity:cartons*2}];
    const rejected=stopStatus==='PARTIAL_REJECT';
    const stopData={id:seedId(`${key}-stop`),packingListId:packing.id,outletId:packing.outletId,sequence:1,status:stopStatus,allocatedCartons:cartons,allocatedWeight:cartons*5,allocatedItems:items,...(terminal?{arrivedAt:at(day,'10:00'),completedAt:at(day,'10:15'),latitude:master.outlets[0].find(outlet=>outlet.id===packing.outletId).latitude,longitude:master.outlets[0].find(outlet=>outlet.id===packing.outletId).longitude}:{}),...(rejected?{rejectedCartons:2,rejectedItems:[{lineId:packing.items[0].lineId,quantity:4}],rejectReason:'Simulasi dua karton kemasan rusak',...(received?{returnReceivedAt:at(day,'13:00'),returnReceivedBy:warehouse.id,returnNote:'Retur demo diperiksa dan diterima gudang'}:{})}:{})};
    const route=await db.deliveryRoute.upsert({where:{code:`${prefix}DR-${scenario}-${dateKey}`},update:{},create:{id:seedId(key),code:`${prefix}DR-${scenario}-${dateKey}`,date:at(day,'00:00'),vehicleId:vehicles[v].id,driverId:drivers[d].id,createdById:warehouse.id,status,totalCartons:cartons,totalWeight:cartons*5,totalDistanceKm:12,notes:'Rute simulasi demo',...(terminal?{odometerPostedAt:at(day,'12:00')}:{}),stops:{create:[stopData]}},include:{stops:true}});
    const stop=route.stops[0];
    if (terminal && stop) for (const type of ['IN','OUT']) await db.deliveryAttendance.upsert({where:{deliveryStopId_driverId_type:{deliveryStopId:stop.id,driverId:drivers[d].id,type}},update:{},create:{id:seedId(`${key}-${type}`),deliveryStopId:stop.id,driverId:drivers[d].id,type,latitude:stop.latitude,longitude:stop.longitude,timestamp:at(day,type==='IN'?'10:00':'10:15'),notes:'Bukti pengiriman simulasi; foto tidak direkayasa'}});
  }
  return packings;
}
