import {z} from 'zod';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {findWarehouseStaff} from './warehouse-staff.service.js';
import {policyNotification} from '../../notifications/services/notification-policy.service.js';
import {inTransaction} from '../../../utils/in-transaction.js';
const schema=z.object({revision:z.number().int().nonnegative(),ownerId:z.string().min(1).nullable(),dueAt:z.string().datetime({offset:true}).nullable(),reason:z.string().trim().min(5).max(2000)}).strict();
export async function assignReturnInspection(stopId,raw,actor,{db=prisma,validateOnly=false}={}){
 const data=schema.parse(raw);
 return inTransaction(db,async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
  const reference=await tx.deliveryStop.findUnique({where:{id:stopId},select:{deliveryRouteId:true}});
  if(!reference)throw new AppError('Tujuan pengiriman tidak ditemukan',404);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`route:${reference.deliveryRouteId}`}))`;
  const stop=await tx.deliveryStop.findUnique({where:{id:stopId},include:{deliveryRoute:true}}),route=stop.deliveryRoute;
  if(!(stop.rejectedCartons>0)||stop.returnInspection||route.cancelledAt)throw new AppError('Pemeriksaan retur tidak lagi terbuka',409);
  const task=route.preparation?.returnTasks?.[stopId];
  if((task?.revision||0)!==data.revision)throw new AppError('Penugasan retur berubah; muat ulang',409);
  let owner=null;
  if(data.ownerId){owner=await findWarehouseStaff(tx,data.ownerId,'can_monitor_delivery');
   if(!owner)throw new AppError('PIC harus petugas gudang/Admin aktif dengan akses pemeriksaan',400);
  }
  if(validateOnly)return task||{};
  const entry={revision:data.revision+1,ownerId:owner?.id||null,ownerName:owner?.name||null,dueAt:data.dueAt,note:data.reason,assignedBy:actor.id,assignedAt:new Date().toISOString()};
  await tx.deliveryRoute.update({where:{id:route.id},data:{preparation:{...route.preparation,returnTasks:{...route.preparation?.returnTasks,[stopId]:entry}}}});
  await tx.auditEvent.create({data:{entityType:'RETURN_INSPECTION',entityId:stopId,action:'ASSIGN',actorId:actor.id,actorName:actor.name,before:task||{},after:entry}});
  if(owner)await policyNotification(tx,{data:{userId:owner.id,type:'DELIVERY_RETURN_ASSIGNED',title:`Periksa retur ${route.code}`,message:data.reason,payload:{routeId:route.id,stopId,dueAt:data.dueAt}}});
  return entry;
 });
}
