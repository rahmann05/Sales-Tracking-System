import {z} from 'zod';
import {VEHICLE_SERVICE_TYPES} from '../../../../../shared/vehicle-service-policy.mjs';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
const intervalShape=Object.fromEntries(VEHICLE_SERVICE_TYPES.map(type=>[type.key,z.number().int().min(100).max(type.max).nullable()]));
export const maintenancePolicySchema=z.object({updatedAt:z.string().datetime(),reason:z.string().trim().min(5).max(2000),reminderMode:z.enum(['INHERIT','ON','OFF']),intervals:z.object(intervalShape).strict()}).strict();
export async function setMaintenancePolicy(id,raw,actor){
 const data=maintenancePolicySchema.parse(raw);
 return prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`vehicle:${id}`}))`;
  const vehicle=await tx.vehicle.findUnique({where:{id}});
  if(!vehicle||vehicle.deletedAt)throw new AppError('Kendaraan tidak ditemukan',404);
  if(+vehicle.updatedAt!==Date.parse(data.updatedAt))throw new AppError('Data kendaraan berubah. Muat ulang sebelum menyimpan interval servis.',409);
  const maintenancePolicy={reminderMode:data.reminderMode,intervals:data.intervals,reason:data.reason,actorId:actor.id,at:new Date().toISOString()};
  const result=await tx.vehicle.update({where:{id},data:{maintenancePolicy}});
  await tx.auditEvent.create({data:{actorId:actor.id,actorName:actor.name,action:'VEHICLE_SERVICE_POLICY',entityType:'VEHICLE',entityId:id,before:{maintenancePolicy:vehicle.maintenancePolicy},after:{maintenancePolicy}}});
  return result;
 });
}
