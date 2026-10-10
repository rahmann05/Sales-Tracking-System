import { wibDayRange } from '../../../../../shared/visit-metrics.mjs';
import { fulfillment } from '../../../../../shared/delivery-operations.mjs';
export async function outletOperationalImpact(db,id) {
  const [scheduled,activeVisits,orders,packings,deliveries]=await Promise.all([
    db.pjpStop.count({where:{outletId:id,status:{in:['PENDING','CLOSED_REPORTED']},pjp:{date:{gte:wibDayRange().gte}}}}),
    db.pjpStop.count({where:{outletId:id,attendances:{some:{type:'IN'},none:{type:'OUT'}},status:{notIn:['VISITED','SKIPPED','CLOSED_REPORTED']}}}),
    db.order.findMany({where:{deletedAt:null,OR:[{outletId:id},{pjpStop:{outletId:id}}],status:{in:['PENDING_APPROVAL','APPROVED']}},include:{items:true}}),
    db.packingList.findMany({where:{outletId:id},include:{deliveryStops:{include:{deliveryRoute:{select:{status:true,cancelledAt:true}}}}}}),
    db.deliveryStop.count({where:{outletId:id,status:'PENDING',deliveryRoute:{cancelledAt:null,status:{not:'COMPLETED'}}}})
  ]);
  const openOrders=orders.filter(o=>o.status==='PENDING_APPROVAL'||['OPEN','PARTIAL'].includes(fulfillment(o,packings).fulfillmentStatus));
  const openPacking=packings.filter(p=>p.status==='DRAFT'||p.status==='RELEASED'&&(p.items || []).some(line=>line.quantity>p.deliveryStops.filter(s=>!s.deliveryRoute.cancelledAt).reduce((sum,s)=>sum+(s.allocatedItems || []).filter(i=>i.lineId===line.lineId).reduce((n,i)=>n+i.quantity,0),0))||p.deliveryStops.some(s=>!s.deliveryRoute.cancelledAt&&s.deliveryRoute.status!=='COMPLETED'));
  return {scheduled,activeVisits,orders:openOrders.length,deliveries,packing:openPacking.length};
}
