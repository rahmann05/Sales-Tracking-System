import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';

export async function vehicleMileage(id){
 const [vehicle,routes,events]=await Promise.all([
  prisma.vehicle.findFirst({where:{id,deletedAt:null}}),
  prisma.deliveryRoute.findMany({where:{vehicleId:id,cancelledAt:null},orderBy:{createdAt:'desc'},take:8,select:{id:true,code:true,createdAt:true,closedAt:true,totalDistanceKm:true,estimatedTravelKm:true,mileagePendingCount:true,actualDistanceKm:true,mileagePlan:true}}),
  prisma.auditEvent.findMany({where:{entityType:'VEHICLE',entityId:id,action:{startsWith:'VEHICLE_MILEAGE_'}},orderBy:{createdAt:'desc'},take:30,select:{id:true,actorName:true,action:true,before:true,after:true,createdAt:true}}),
 ]);
 if(!vehicle)throw new AppError('Kendaraan tidak ditemukan',404);
 return {vehicle,routes:routes.map(({mileagePlan,...route})=>({...route,distanceSource:mileagePlan?.source||null})),events};
}

export async function correctVehicleMileage(id,{odometerKm,reason,updatedAt},actor){
 return prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`vehicle:${id}`}))`;
  const vehicle=await tx.vehicle.findFirst({where:{id,deletedAt:null}});
  if(!vehicle)throw new AppError('Kendaraan tidak ditemukan',404);
  if(new Date(updatedAt).getTime()!==vehicle.updatedAt.getTime())throw new AppError('Kilometer kendaraan telah berubah. Muat ulang sebelum mengoreksi.',409);
  const activeTrip=await tx.deliveryRoute.findFirst({where:{vehicleId:id,departedAt:{not:null},closedAt:null,cancelledAt:null},select:{code:true}});
  if(activeTrip)throw new AppError(`Trip ${activeTrip.code} masih terbuka. Tutup trip sebelum mengoreksi kilometer kendaraan.`,409);
  const lastService=await tx.vehicleServiceRecord.findFirst({where:{vehicleId:id},orderBy:{serviceDate:'desc'},select:{odometerAtService:true}});
  if(lastService&&odometerKm<lastService.odometerAtService)throw new AppError('Kilometer koreksi lebih kecil daripada odometer servis terakhir.',422);
  const before={totalKm:vehicle.totalKm,estimatedKm:vehicle.estimatedKm};
  const updated=await tx.vehicle.update({where:{id},data:{totalKm:odometerKm,estimatedKm:odometerKm}});
  await tx.auditEvent.create({data:{actorId:actor.id,actorName:actor.name,action:'VEHICLE_MILEAGE_ADMIN_CORRECTION',entityType:'VEHICLE',entityId:id,before,after:{totalKm:updated.totalKm,estimatedKm:updated.estimatedKm,reason,referenceEstimatedKm:vehicle.estimatedKm,recordedAt:new Date().toISOString()}}});
  return updated;
 },{isolationLevel:'Serializable'});
}
