/** updateVehicle - single-responsibility service (extracted from vehicles.service.js). */
import { prisma } from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';


export const updateVehicle = async (id, data, actor) => {
  return prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`vehicle:${id}`}))`;
    const vehicle=await tx.vehicle.findUnique({where:{id}});
    if(!vehicle||vehicle.deletedAt)throw new AppError('Kendaraan tidak ditemukan',404);
    const changed=['maxCartons','maxWeightKg'].some(key=>data[key]!=null&&data[key]!==vehicle[key]);
    const capacityProfile=changed?{...(vehicle.capacityProfile||{}),status:'ESTIMATED',reviewedBy:actor.id,reviewedAt:new Date().toISOString(),notes:'Patokan diubah melalui master kendaraan; konfirmasi pengukuran ulang melalui pengaturan kapasitas.'}:vehicle.capacityProfile;
    const next=await tx.vehicle.update({where:{id},data:{...data,...(changed?{capacityProfile}:{})}});
    if(changed)await tx.auditEvent.create({data:{actorId:actor.id,actorName:actor.name,action:'VEHICLE_CAPACITY_UPDATED',entityType:'VEHICLE',entityId:id,before:{maxCartons:vehicle.maxCartons,maxWeightKg:vehicle.maxWeightKg,capacityProfile:vehicle.capacityProfile},after:{maxCartons:next.maxCartons,maxWeightKg:next.maxWeightKg,capacityProfile,reason:'Perubahan melalui master kendaraan'}}});
    return next;
  },{isolationLevel:'Serializable'});
};
