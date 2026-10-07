import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { finalizeRoute, terminalStop, reconcilePackingInvoices } from './route-lifecycle.service.js';
export async function recordStopResult(tx,stopId,data,driverId) {
  const stop=await tx.deliveryStop.findUnique({where:{id:stopId},include:{deliveryRoute:true,packingList:true}});
  if(!stop)throw new AppError('Stop pengiriman tidak ditemukan',404);
  if(stop.deliveryRoute.driverId!==driverId)throw new AppError('Rute bukan tugas Anda',403);
  if(stop.status!=='PENDING')throw new AppError('Hasil pengiriman sudah final',409);
  if(!['READY','IN_TRANSIT'].includes(stop.deliveryRoute.status))throw new AppError('Rute belum siap',409);
  const {status,rejectReason,notes,photoUrl}=data;
  if(!terminalStop(status))throw new AppError('Hasil tidak valid',400);
  if(await getDynamicConfig('DELIVERY_REQUIRE_PHOTO',true) && !photoUrl)throw new AppError('Foto bukti pengiriman wajib',400);
  if(status!=='DELIVERED' && !rejectReason?.trim())throw new AppError('Alasan penolakan wajib',400);
  const rejectedCartons=status==='REJECTED'?stop.allocatedCartons:status==='DELIVERED'?0:data.rejectedCartons;
  if(!Number.isInteger(rejectedCartons)||rejectedCartons<0||(status==='PARTIAL_REJECT'&&(!rejectedCartons||rejectedCartons>=stop.allocatedCartons)))throw new AppError('Jumlah karton ditolak tidak valid',400);
  const rejectedItems=status==='REJECTED'?stop.allocatedItems:status==='DELIVERED'?[]:data.rejectedItems||[];
  if(!Array.isArray(rejectedItems)||new Set(rejectedItems.map(i=>i.lineId)).size!==rejectedItems.length)throw new AppError('Barang ditolak tidak valid',400);
  for(const line of rejectedItems){const original=(stop.allocatedItems||[]).find(i=>i.lineId===line.lineId);if(!original||!Number.isInteger(line.quantity)||line.quantity<=0||line.quantity>original.quantity)throw new AppError('Jumlah barang ditolak melebihi muatan',400);}
  if(status==='PARTIAL_REJECT' && stop.allocatedItems.length && (!rejectedItems.length||stop.allocatedItems.every(i=>(rejectedItems.find(r=>r.lineId===i.lineId)?.quantity||0)===i.quantity)))throw new AppError('Rincian barang penolakan sebagian wajib dan harus menyisakan barang diterima',400);
  const changed=await tx.deliveryStop.updateMany({where:{id:stopId,status:'PENDING'},data:{status,rejectReason:status==='DELIVERED'?null:rejectReason.trim(),rejectedCartons,rejectedItems,notes,photoUrl,completedAt:new Date()}});
  if(!changed.count)throw new AppError('Hasil sudah disimpan',409);
  await reconcilePackingInvoices(tx,stop.packingListId);
  const stops=await tx.deliveryStop.findMany({where:{deliveryRouteId:stop.deliveryRouteId}});
  if(stops.every(s=>terminalStop(s.status)))await finalizeRoute(tx,stop.deliveryRouteId);
  return tx.deliveryStop.findUnique({where:{id:stopId},include:{outlet:true,packingList:{include:{invoices:true}}}});
}
export const updateStopStatus=(stopId,data,driverId)=>prisma.$transaction(tx=>recordStopResult(tx,stopId,data,driverId),{isolationLevel:'Serializable'});
