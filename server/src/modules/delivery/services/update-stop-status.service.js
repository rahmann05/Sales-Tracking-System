import {assertEvidenceImages} from '../../../utils/evidence-images.js';
import {deliveryReceiptError} from '../../../../../shared/delivery-receipt.mjs';
import {processValue} from '../../config/services/process-policy.service.js';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { finalizeRoute, terminalStop, reconcilePackingInvoices } from './route-lifecycle.service.js';
import {lockDestinationRoute,assertDestinationStart,flagIncompleteDestinations,flagMissingCheckout} from './destination-policy.service.js';
import {deliveryRequest} from './delivery-request.service.js';
export async function recordStopResult(tx,stopId,data,driverId) {
  const stop=await tx.deliveryStop.findUnique({where:{id:stopId},include:{deliveryRoute:true,packingList:true,attendances:true}});
  if(!stop)throw new AppError('Stop pengiriman tidak ditemukan',404);
  if(stop.deliveryRoute.driverId!==driverId)throw new AppError('Rute bukan tugas Anda',403);
  if(stop.status!=='PENDING')throw new AppError('Hasil pengiriman sudah final',409);
  if(stop.deliveryRoute.status!=='IN_TRANSIT'||stop.deliveryRoute.onHold||stop.deliveryRoute.closedAt||stop.deliveryRoute.cancelledAt)throw new AppError('Rute belum berangkat atau tidak aktif',409);
  const mode=await processValue(stop.deliveryRoute,'DELIVERY_ATTENDANCE_MODE','IN_OUT');
  if(mode!=='OPTIONAL'&&!stop.attendances.some(a=>a.type==='IN'))throw new AppError('Absen masuk di tujuan terlebih dahulu',409);
  const missingOut=mode==='IN_OUT'&&!stop.attendances.some(a=>a.type==='OUT');
  if(missingOut){
    const allowed=stop.deliveryRoute.policySnapshot?stop.deliveryRoute.policySnapshot.values?.DELIVERY_ALLOW_RESULT_WITHOUT_OUT===true:await processValue(stop.deliveryRoute,'DELIVERY_ALLOW_RESULT_WITHOUT_OUT',false);
    if(!allowed)throw new AppError('Kirim hasil melalui absen keluar tujuan',409);
    if(typeof data.missingCheckoutReason!=='string'||data.missingCheckoutReason.trim().length<5||data.missingCheckoutReason.trim().length>2000)throw new AppError('Alasan hasil tanpa absen keluar wajib diisi 5–2000 karakter',400);
  }
  const {status,rejectReason,notes,photoUrl}=data;
  await assertEvidenceImages({photoUrl},{entity:stop.deliveryRoute});
  if(!terminalStop(status))throw new AppError('Hasil tidak valid',400);
  if(await processValue(stop.deliveryRoute,'DELIVERY_REQUIRE_PHOTO',true) && !photoUrl)throw new AppError('Foto bukti pengiriman wajib',400);
  if(status!=='DELIVERED' && !rejectReason?.trim())throw new AppError('Alasan penolakan wajib',400);
  const receiptPolicy={DELIVERY_RECIPIENT_MODE:await processValue(stop.deliveryRoute,'DELIVERY_RECIPIENT_MODE','OPTIONAL'),DELIVERY_SIGNATURE_MODE:await processValue(stop.deliveryRoute,'DELIVERY_SIGNATURE_MODE','DISABLED')};
  const receiptError=deliveryReceiptError(status,data,receiptPolicy);
  if(receiptError)throw new AppError(receiptError,422);
  const receiptEvidence=(data.recipientName?.trim()||data.signatureDataUrl)?{recipientName:data.recipientName.trim(),signatureDataUrl:data.signatureDataUrl||null,recordedBy:driverId,recordedAt:new Date().toISOString()}:undefined;
  const rejectedCartons=status==='REJECTED'?stop.allocatedCartons:status==='DELIVERED'?0:data.rejectedCartons;
  if(!Number.isInteger(rejectedCartons)||rejectedCartons<0||(status==='PARTIAL_REJECT'&&(!rejectedCartons||rejectedCartons>=stop.allocatedCartons)))throw new AppError('Jumlah karton ditolak tidak valid',400);
  const rejectedItems=status==='REJECTED'?stop.allocatedItems:status==='DELIVERED'?[]:data.rejectedItems||[];
  if(!Array.isArray(rejectedItems)||new Set(rejectedItems.map(i=>i.lineId)).size!==rejectedItems.length)throw new AppError('Barang ditolak tidak valid',400);
  for(const line of rejectedItems){const original=(stop.allocatedItems||[]).find(i=>i.lineId===line.lineId);if(!original||!Number.isInteger(line.quantity)||line.quantity<=0||line.quantity>original.quantity)throw new AppError('Jumlah barang ditolak melebihi muatan',400);}
  if(status==='PARTIAL_REJECT' && stop.allocatedItems.length && (!rejectedItems.length||stop.allocatedItems.every(i=>(rejectedItems.find(r=>r.lineId===i.lineId)?.quantity||0)===i.quantity)))throw new AppError('Rincian barang penolakan sebagian wajib dan harus menyisakan barang diterima',400);
  const rejectedInvoices = status==='REJECTED' ? stop.allocatedInvoices : status==='DELIVERED' ? [] : data.rejectedInvoices || [];
  if ((stop.allocatedInvoices || []).length) {
    if(new Set(rejectedInvoices.map(i=>i.invoiceId)).size!==rejectedInvoices.length || rejectedInvoices.reduce((n,i)=>n+i.cartons,0)!==rejectedCartons)throw new AppError('Rincian faktur ditolak harus sesuai jumlah karton',400);
    for(const i of rejectedInvoices)if(!Number.isInteger(i.cartons)||i.cartons<=0||i.cartons>((stop.allocatedInvoices||[]).find(a=>a.invoiceId===i.invoiceId)?.cartons||0))throw new AppError('Penolakan faktur melebihi alokasi',400);
  }
  const incomplete=await assertDestinationStart(tx,stop);
  const changed=await tx.deliveryStop.updateMany({where:{id:stopId,status:'PENDING'},data:{status,rejectReason:status==='DELIVERED'?null:rejectReason.trim(),rejectedCartons,rejectedItems,rejectedInvoices,notes,photoUrl,receiptEvidence,completedAt:new Date()}});
  if(!changed.count)throw new AppError('Hasil sudah disimpan',409);
  await flagIncompleteDestinations(tx,stop,incomplete,driverId);
  if(missingOut)await flagMissingCheckout(tx,stop,data.missingCheckoutReason.trim(),driverId);
  if(status!=='DELIVERED')await tx.deliveryIssue.create({data:{routeId:stop.deliveryRouteId,packingListId:stop.packingListId,stopId,title:'Penolakan pengiriman / tindak lanjut pelanggan',reason:rejectReason.trim(),ownerId:stop.deliveryRoute.createdById,createdById:driverId,dueAt:new Date(Date.now()+(await getDynamicConfig('DELIVERY_ISSUE_DEFAULT_HOURS',24))*3600000),history:[{action:'AUTO_REJECTION',actorId:driverId,at:new Date().toISOString()}]}});
  await reconcilePackingInvoices(tx,stop.packingListId);
  const stops=await tx.deliveryStop.findMany({where:{deliveryRouteId:stop.deliveryRouteId}});
  if(stops.every(s=>terminalStop(s.status)))await finalizeRoute(tx,stop.deliveryRouteId);
  return tx.deliveryStop.findUnique({where:{id:stopId},include:{outlet:true,packingList:{include:{invoices:true}}}});
}
export const updateStopStatus=(stopId,data,driverId)=>prisma.$transaction(async tx=>{
 await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
 await lockDestinationRoute(tx,stopId);
 return deliveryRequest(tx,{stopId,data,driverId,kind:'RESULT'},()=>recordStopResult(tx,stopId,data,driverId));
},{isolationLevel:'ReadCommitted'});
