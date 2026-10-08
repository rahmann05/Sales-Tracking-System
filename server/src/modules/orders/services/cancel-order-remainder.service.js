import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {fulfillment} from '../../../../../shared/delivery-operations.mjs';
export const cancelOrderRemainder=(id,data,user)=>prisma.$transaction(async tx=>{
  if(user.role!=='ADMIN')throw new AppError('Pembatalan sisa order hanya oleh Admin',403);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`order:${id}`}))`;
  const order=await tx.order.findUnique({where:{id},include:{items:{include:{product:true}}}});
  if(!order||order.deletedAt||order.status!=='APPROVED')throw new AppError('Hanya sisa order disetujui yang dapat dibatalkan',409);
  const packings=await tx.packingList.findMany({where:{sourceOrderId:id},include:{deliveryStops:true}});
  const state=fulfillment(order,packings);
  if(!data.note?.trim()||!data.lines?.length||new Set(data.lines.map(i=>i.id)).size!==data.lines.length)throw new AppError('Alasan dan baris pembatalan wajib',400);
  for(const line of data.lines){
    const item=state.fulfillmentLines.find(i=>i.id===line.id);
    if(!item||!Number.isInteger(line.quantity)||line.quantity<=0||line.quantity>Math.min(item.unpacked,item.remaining))throw new AppError('Pembatalan melebihi sisa yang belum dipacking. Tarik/revisi packing atau periksa retur terlebih dahulu.',409);
    await tx.orderItem.update({where:{id:line.id},data:{cancelledQuantity:{increment:line.quantity}}});
  }
  await tx.order.update({where:{id},data:{history:[...order.history,{action:'CANCEL_REMAINDER',actorId:user.id,actorName:user.name,at:new Date().toISOString(),note:data.note.trim(),lines:data.lines}]}});
  await tx.notification.create({data:{userId:order.createdBy,type:'ORDER_REMAINDER_CANCELLED',title:'Sisa order dibatalkan',message:data.note.trim(),payload:{orderId:id,lines:data.lines}}});
  return fulfillment(await tx.order.findUnique({where:{id},include:{items:{include:{product:true}},pjpStop:{include:{outlet:true}}}}),packings);
},{isolationLevel:'Serializable'});
