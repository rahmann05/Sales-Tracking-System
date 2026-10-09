import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { findWarehouseStaff } from './warehouse-staff.service.js';
export const receiveReturn = (stopId, userId, data) => prisma.$transaction(async tx => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
  const actor=await findWarehouseStaff(tx,userId,'can_monitor_delivery');
  if(!actor)throw new AppError('Akun tidak aktif atau tidak memiliki izin pemeriksaan retur',403);
  const reference=await tx.deliveryStop.findUnique({where:{id:stopId},select:{deliveryRouteId:true}});
  if(!reference)throw new AppError('Pengiriman tidak ditemukan',404);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`route:${reference.deliveryRouteId}`}))`;
  const stop = await tx.deliveryStop.findUnique({ where: { id: stopId }, include: { deliveryRoute: true } });
  const task=stop?.deliveryRoute?.preparation?.returnTasks?.[stopId];
  if(task?.ownerId&&task.ownerId!==userId){
    if(actor.role!=='ADMIN')throw new AppError('Pemeriksaan retur ditugaskan kepada petugas lain. Alihkan penugasan terlebih dahulu.',403);
  }
  if (!stop) throw new AppError('Pengiriman tidak ditemukan', 404);
  if (!['REJECTED','PARTIAL_REJECT'].includes(stop.status) || !(stop.rejectedCartons > 0)) throw new AppError('Tidak ada retur', 409);
  if (stop.returnInspection) throw new AppError('Retur sudah diperiksa', 409);
  if (!data.note?.trim() || data.receivedCartons > stop.rejectedCartons || data.reusableCartons > data.receivedCartons) throw new AppError('Jumlah fisik/layak kirim tidak valid', 400);
  const expected = stop.rejectedItems || [];
  if (new Set(data.items.map(i=>i.lineId)).size !== data.items.length || data.items.length !== expected.length) throw new AppError('Periksa seluruh barang retur', 400);
  for (const i of data.items) if (!expected.some(e=>e.lineId===i.lineId && i.received<=e.quantity && i.reusable<=i.received)) throw new AppError('Jumlah barang retur tidak valid', 400);
  if ((data.reusableCartons === 0) !== data.items.every(i=>i.reusable===0)) throw new AppError('Karton dan barang layak kirim harus sama-sama kosong atau terisi',400);
  const reusableItems = data.items.filter(i=>i.reusable>0).map(i=>({lineId:i.lineId,quantity:i.reusable}));
  const invoices = data.reusableInvoices || [];
  if ((stop.allocatedInvoices || []).length && (new Set(invoices.map(i=>i.invoiceId)).size!==invoices.length || invoices.reduce((n,i)=>n+i.cartons,0)!==data.reusableCartons || invoices.some(i=>i.cartons>((stop.rejectedInvoices||[]).find(x=>x.invoiceId===i.invoiceId)?.cartons||0)))) throw new AppError('Karton layak kirim per faktur tidak sesuai',400);
  const changed = await tx.deliveryStop.updateMany({ where: { id: stopId, returnInspection: { equals: Prisma.DbNull } }, data: { returnReceivedAt: new Date(), returnReceivedBy: userId, returnNote: data.note.trim(), returnInspection: { ...data, actorId:userId, at:new Date().toISOString() }, reusableCartons:data.reusableCartons,reusableItems,reusableInvoices:invoices } });
  if (!changed.count) throw new AppError('Retur sudah diproses; muat ulang',409);
  if(data.receivedCartons!==stop.rejectedCartons||data.reusableCartons!==data.receivedCartons||data.items.some(i=>i.reusable!==i.received || i.received!==expected.find(e=>e.lineId===i.lineId).quantity)) await tx.deliveryIssue.create({data:{routeId:stop.deliveryRouteId,stopId,packingListId:stop.packingListId,title:'Selisih / barang retur tidak layak kirim',reason:data.note,ownerId:stop.deliveryRoute.createdById,createdById:userId,dueAt:new Date(Date.now()+86400000)}});
  return tx.deliveryStop.findUnique({where:{id:stopId}});
}, {isolationLevel:'ReadCommitted'});
