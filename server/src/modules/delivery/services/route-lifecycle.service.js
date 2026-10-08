import { AppError } from '../../../utils/errors.js';
import {invoiceReconciliation} from '../../../../../shared/invoice-reconciliation.mjs';
export const terminalStop = status => ['DELIVERED','REJECTED','PARTIAL_REJECT'].includes(status);
export async function finalizeRoute(tx, id) {
  const route=await tx.deliveryRoute.findUnique({where:{id},include:{stops:true}});
  if(!route.stops.length || !route.stops.every(s=>terminalStop(s.status))) throw new AppError('Selesaikan seluruh hasil pengiriman terlebih dahulu',409);
  const status=route.stops.every(s=>s.status==='DELIVERED')?'COMPLETED':'PARTIAL';
  await tx.deliveryRoute.update({where:{id},data:{status}});
  return tx.deliveryRoute.findUnique({where:{id},include:{vehicle:true,driver:{select:{id:true,name:true}}}});
}
export async function reconcilePackingInvoices(tx, packingListId) {
  const packing=await tx.packingList.findUnique({where:{id:packingListId},include:{deliveryStops:true,invoices:true}});
  const accepted=packing.deliveryStops.reduce((n,s)=>n+(terminalStop(s.status)?s.allocatedCartons-(s.rejectedCartons||0):0),0);
  const itemsComplete=(packing.items||[]).every(item=>packing.deliveryStops.reduce((n,s)=>n+(terminalStop(s.status)?(s.allocatedItems||[]).find(x=>x.lineId===item.lineId)?.quantity||0:0)-((s.rejectedItems||[]).find(x=>x.lineId===item.lineId)?.quantity||0),0)>=item.quantity);
  const delivered=accepted===packing.totalCartons && itemsComplete;
  const legacy = packing.deliveryStops.some(s => !(s.allocatedInvoices || []).length);
  const commercial=invoiceReconciliation(packing);
  for (const invoice of packing.invoices) {
    const cartons = packing.deliveryStops.filter(s => terminalStop(s.status)).reduce((n,s) => n + (s.allocatedInvoices || []).filter(i=>i.invoiceId===invoice.id).reduce((a,i)=>a+i.cartons,0) - (s.rejectedInvoices || []).filter(i=>i.invoiceId===invoice.id).reduce((a,i)=>a+i.cartons,0),0);
    const receipt=commercial.invoices.find(i=>i.id===invoice.id);
    const goodsComplete=!(invoice.items||[]).length||!!receipt?.acceptedItems&&(invoice.items||[]).every(i=>(receipt.acceptedItems.find(a=>a.lineId===i.lineId)?.quantity||0)===i.quantity);
    const complete = (legacy ? delivered : cartons === invoice.totalCartons)&&goodsComplete;
    await tx.invoice.update({where:{id:invoice.id},data:{isDelivered:complete,deliveredAt:complete?(invoice.deliveredAt || new Date()):null}});
  }
}
