import {createHash} from 'node:crypto';
import {z} from 'zod';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {lockDestinationRoute} from './destination-policy.service.js';
function canonical(value){return Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>[k,canonical(value[k])])):value;}
const keyFor=(actorId,id)=>`_DELIVERY_REQUEST:${actorId}:${id}`;
async function resultFor(db,receipt){
 return receipt.kind==='ATTENDANCE'?db.deliveryAttendance.findUnique({where:{id:receipt.resultId}}):db.deliveryStop.findUnique({where:{id:receipt.resultId},include:{outlet:true,packingList:{include:{invoices:true}}}});
}
export async function deliveryRequest(db,{stopId,data,driverId,kind},work){
 if(!data.requestId)return work();
 if(!z.string().uuid().safeParse(data.requestId).success)throw new AppError('Identitas pengiriman tidak valid.',400);
 const key=keyFor(driverId,data.requestId);
 await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
 const stop=await db.deliveryStop.findUnique({where:{id:stopId},select:{deliveryRoute:{select:{driverId:true}}}});
 if(!stop)throw new AppError('Tujuan tidak ditemukan.',404);
 if(stop.deliveryRoute.driverId!==driverId)throw new AppError('Rute bukan tugas Anda.',403);
 const hash=createHash('sha256').update(JSON.stringify(canonical({stopId,kind,data}))).digest('hex');
 const saved=await db.systemConfig.findUnique({where:{key}});
 if(saved){if(saved.value.cancelled)throw new AppError('Pengiriman ini dibatalkan sebelum tersimpan. Gunakan identitas baru setelah memperbarui bukti.',409);if(saved.value.hash!==hash)throw new AppError('Identitas permintaan sudah dipakai untuk isi berbeda. Periksa hasil sebelumnya.',409);return resultFor(db,saved.value);}
 const result=await work();
 await db.systemConfig.create({data:{key,value:{hash,stopId,kind,resultId:result.id,at:new Date().toISOString()}}});
 return result;
}
export async function findDeliveryRequest(stopId,requestId,actor){
 if(!z.string().uuid().safeParse(requestId).success)throw new AppError('Identitas pengiriman tidak valid.',400);
 const stop=await prisma.deliveryStop.findUnique({where:{id:stopId},select:{deliveryRoute:{select:{driverId:true}}}});
 if(!stop||stop.deliveryRoute.driverId!==actor.id)throw new AppError('Tujuan tidak ditemukan.',404);
 const receipt=await prisma.systemConfig.findUnique({where:{key:keyFor(actor.id,requestId)}});
 if(receipt&&receipt.value.stopId!==stopId)throw new AppError('Permintaan tidak sesuai tujuan.',409);
 return receipt?.value.cancelled?{confirmed:false,cancelled:true}:receipt?{confirmed:true,kind:receipt.value.kind,result:await resultFor(prisma,receipt.value)}:{confirmed:false};
}
export async function cancelDeliveryRequest(stopId,requestId,actor){
 if(!z.string().uuid().safeParse(requestId).success)throw new AppError('Identitas pengiriman tidak valid.',400);
 return prisma.$transaction(async db=>{
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
  await lockDestinationRoute(db,stopId);const key=keyFor(actor.id,requestId);
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  const stop=await db.deliveryStop.findUnique({where:{id:stopId},select:{deliveryRoute:{select:{driverId:true}}}});
  if(!stop||stop.deliveryRoute.driverId!==actor.id)throw new AppError('Tujuan tidak ditemukan.',404);
  const saved=await db.systemConfig.findUnique({where:{key}});
  if(saved){if(saved.value.stopId!==stopId)throw new AppError('Permintaan tidak sesuai tujuan.',409);return saved.value.cancelled?{confirmed:false,cancelled:true}:{confirmed:true,kind:saved.value.kind,result:await resultFor(db,saved.value)};}
  await db.systemConfig.create({data:{key,value:{cancelled:true,stopId,at:new Date().toISOString()}}});
  await db.auditEvent.create({data:{entityType:'DELIVERY_REQUEST',entityId:requestId,action:'CANCEL_PENDING',actorId:actor.id,actorName:actor.name,before:{confirmed:false},after:{cancelled:true,stopId}}});
  return {confirmed:false,cancelled:true};
 });
}
