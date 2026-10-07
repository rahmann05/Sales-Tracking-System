import { AppError } from '../../../utils/errors.js';
export const terminalStop = status => ['DELIVERED','REJECTED','PARTIAL_REJECT'].includes(status);
export async function finalizeRoute(tx, id) {
  const route=await tx.deliveryRoute.findUnique({where:{id},include:{stops:true}});
  if(!route.stops.length || !route.stops.every(s=>terminalStop(s.status))) throw new AppError('Selesaikan seluruh hasil pengiriman terlebih dahulu',409);
  const status=route.stops.every(s=>s.status==='DELIVERED')?'COMPLETED':'PARTIAL';
  const posted=await tx.deliveryRoute.updateMany({where:{id,odometerPostedAt:null},data:{status,odometerPostedAt:new Date()}});
  if(posted.count && route.totalDistanceKm>0) await tx.vehicle.update({where:{id:route.vehicleId},data:{totalKm:{increment:route.totalDistanceKm}}});
  return tx.deliveryRoute.findUnique({where:{id},include:{vehicle:true,driver:{select:{id:true,name:true}}}});
}
export async function reconcilePackingInvoices(tx, packingListId) {
  const packing=await tx.packingList.findUnique({where:{id:packingListId},include:{deliveryStops:true}});
  const accepted=packing.deliveryStops.reduce((n,s)=>n+(terminalStop(s.status)?s.allocatedCartons-(s.rejectedCartons||0):0),0);
  const itemsComplete=(packing.items||[]).every(item=>packing.deliveryStops.reduce((n,s)=>n+(terminalStop(s.status)?(s.allocatedItems||[]).find(x=>x.lineId===item.lineId)?.quantity||0:0)-((s.rejectedItems||[]).find(x=>x.lineId===item.lineId)?.quantity||0),0)>=item.quantity);
  const delivered=accepted===packing.totalCartons && itemsComplete;
  await tx.invoice.updateMany({where:{packingListId},data:{isDelivered:delivered,deliveredAt:delivered?new Date():null}});
}
