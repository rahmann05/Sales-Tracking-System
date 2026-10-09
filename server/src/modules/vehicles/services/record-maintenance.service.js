import {createHash} from 'node:crypto';
import {AppError} from '../../../utils/errors.js';
import {prisma} from '../../../config/prisma.js';
import {capturePolicySnapshot} from '../../config/services/process-policy.service.js';
import {VEHICLE_SERVICE_TYPES,VEHICLE_SERVICE_RULE_KEYS} from '../../../../../shared/vehicle-service-policy.mjs';
import {validateMaintenanceInput} from './maintenance-input-policy.service.js';

export const recordMaintenance=async(id,data,actor={})=>{
 const normalized={vehicleId:id,serviceType:data.serviceType,odometerAtService:data.odometerAtService,cost:data.cost??0,workshopName:data.workshopName?.trim()||'',notes:data.notes?.trim()||null,serviceDate:data.serviceDate||null};
 const requestHash=createHash('sha256').update(JSON.stringify({...normalized,actorId:actor.id||null})).digest('hex');
 return prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`vehicle:${id}`}))`;
  const vehicle=await tx.vehicle.findUnique({where:{id}});
  if(!vehicle||vehicle.deletedAt)throw new AppError('Kendaraan tidak ditemukan',404);
  if(data.requestId){
   const existing=await tx.vehicleServiceRecord.findUnique({where:{requestId:data.requestId}});
   if(existing){
    if(existing.vehicleId!==id||existing.policySnapshot?.requestHash!==requestHash)throw new AppError('ID pengiriman servis sudah dipakai untuk isian berbeda. Muat ulang catatan sebelum membuat input baru.',409);
    return {record:existing,updatedVehicle:vehicle};
   }
  }
  const captured=await capturePolicySnapshot(),keys=[...VEHICLE_SERVICE_RULE_KEYS,...VEHICLE_SERVICE_TYPES.map(type=>type.config)];
  const policySnapshot={...captured,values:Object.fromEntries(keys.map(key=>[key,captured.values[key]])),requestHash,maintenancePolicy:vehicle.maintenancePolicy};
  const serviceDate=validateMaintenanceInput(data,policySnapshot.values);
  const change={totalKm:Math.max(vehicle.totalKm,data.odometerAtService)},type=VEHICLE_SERVICE_TYPES.find(t=>t.key===data.serviceType);
  if(type)change[type.field]=Math.max(vehicle[type.field],data.odometerAtService);
  const record=await tx.vehicleServiceRecord.create({data:{...normalized,serviceDate,requestId:data.requestId,policySnapshot}});
  const updatedVehicle=await tx.vehicle.update({where:{id},data:change});
  await tx.auditEvent.create({data:{actorId:actor.id||null,actorName:actor.name||null,action:'VEHICLE_SERVICE_RECORDED',entityType:'VEHICLE_SERVICE',entityId:record.id,before:{totalKm:vehicle.totalKm},after:{vehicleId:id,serviceType:data.serviceType,odometerAtService:data.odometerAtService,serviceDate:serviceDate.toISOString(),totalKm:updatedVehicle.totalKm}}});
  return {record,updatedVehicle};
 });
};
