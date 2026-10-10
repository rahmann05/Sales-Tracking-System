import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {invoiceReconciliation,invoiceMappingErrors} from '../../../../../shared/invoice-reconciliation.mjs';
import {packingBalance} from '../../../../../shared/packing.mjs';
import {reconcilePackingInvoices} from './route-lifecycle.service.js';
import {mapInvoiceCommercial} from './invoice-mapping.service.js';
import {packingOrderIds} from '../../../../../shared/packing-orders.mjs';
export const reconcileInvoiceReceipt=(id,data,user)=>prisma.$transaction(async tx=>{
  if(user.role!=='ADMIN')throw new AppError('Rekonsiliasi faktur hanya oleh Admin',403);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`packing:${id}`}))`;
  const packing=await tx.packingList.findUnique({where:{id},include:{invoices:true,deliveryStops:true}});
  if(!packing)throw new AppError('Packing tidak ditemukan',404);
  const state=invoiceReconciliation(packing);
  if(data.fingerprint!==state.fingerprint)throw new AppError('Hasil pengiriman berubah. Muat ulang sebelum konfirmasi.',409);
  if(state.errors.length||!state.resolved||packingBalance(packing).remainingCartons>0||packingBalance(packing).remainingItems.some(i=>i.remaining>0))throw new AppError('Lengkapi pemetaan faktur, seluruh hasil pengiriman dan pemeriksaan retur dahulu.',409);
  if(!data.note?.trim()||data.invoices.length!==packing.invoices.length||new Set(data.invoices.map(i=>i.invoiceId)).size!==data.invoices.length)throw new AppError('Catatan dan seluruh faktur wajib dikonfirmasi sekali',400);
  const accepted=new Map();
  for(const invoice of data.invoices){
    const original=packing.invoices.find(i=>i.id===invoice.invoiceId);
    if(!original||new Set(invoice.items.map(i=>i.lineId)).size!==invoice.items.length)throw new AppError('Identitas faktur/baris tidak valid',400);
    for(const line of invoice.items){
      const source=original.items.find(i=>i.lineId===line.lineId);
      if(!source||!Number.isInteger(line.quantity)||line.quantity<0||line.quantity>source.quantity)throw new AppError('Jumlah diterima melebihi baris faktur',409);
      accepted.set(line.lineId,(accepted.get(line.lineId)||0)+line.quantity);
    }
  }
  for(const [lineId,quantity] of Object.entries(state.accepted))if((accepted.get(lineId)||0)!==quantity)throw new AppError('Jumlah diterima per faktur harus sama dengan bukti hasil pengiriman barang',409);
  const record={actorId:user.id,actorName:user.name,at:new Date().toISOString(),note:data.note.trim(),fingerprint:state.fingerprint,invoices:data.invoices};
  await tx.packingList.update({where:{id},data:{commercialReconciliation:record,history:[...packing.history,{action:'RECONCILE_INVOICE_RECEIPT',userId:user.id,at:record.at,note:record.note,before:packing.commercialReconciliation,after:record}]}});
  await reconcilePackingInvoices(tx,id);
  const result=await tx.packingList.findUnique({where:{id},include:{invoices:true,deliveryStops:true}});
  return {...result,commercial:invoiceReconciliation(result)};
},{isolationLevel:'Serializable'});

export const correctInvoiceCommercial=(id,data,user)=>prisma.$transaction(async tx=>{
  if(user.role!=='ADMIN')throw new AppError('Koreksi faktur hanya oleh Admin',403);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`packing:${id}`}))`;
  const packing=await tx.packingList.findUnique({where:{id},include:{invoices:true,deliveryStops:true}});
  if(!packing)throw new AppError('Packing tidak ditemukan',404);
  if(packing.revision!==data.revision)throw new AppError('Dokumen berubah. Muat ulang.',409);
  if(!data.note?.trim()||data.invoices.length!==packing.invoices.length||new Set(data.invoices.map(i=>i.id)).size!==data.invoices.length)throw new AppError('Alasan dan seluruh faktur wajib diisi',400);
  const sourceIds=packingOrderIds(packing),orders=[];
  for(const sourceId of sourceIds){const order=await tx.order.findUnique({where:{id:sourceId},include:{items:true}});if(!order)throw new AppError('Order sumber tidak ditemukan; perlu pemeriksaan dokumen lama',409);orders.push(order);}
  const invoices=data.invoices.map(i=>{
    if(!packing.invoices.some(v=>v.id===i.id))throw new AppError('Identitas faktur berubah',409);
    return mapInvoiceCommercial(i,packing.items,orders);
  });
  const errors=invoiceMappingErrors({items:packing.items,invoices});if(errors.length)throw new AppError(errors[0],400);
  for(const invoice of invoices){const {id:invoiceId,...commercial}=invoice;await tx.invoice.update({where:{id:invoiceId},data:commercial});}
  await tx.packingList.update({where:{id},data:{revision:{increment:1},history:[...packing.history,{action:'CORRECT_INVOICE_COMMERCIAL',userId:user.id,at:new Date().toISOString(),note:data.note.trim(),before:packing.invoices,after:invoices}]}});
  await reconcilePackingInvoices(tx,id);
  const result=await tx.packingList.findUnique({where:{id},include:{invoices:true,deliveryStops:true}});
  return {...result,commercial:invoiceReconciliation(result)};
},{isolationLevel:'Serializable'});
