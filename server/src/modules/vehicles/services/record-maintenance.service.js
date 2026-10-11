import {createHash} from 'node:crypto';
import {freshDomainActor} from '../../../middlewares/domain-permission.middleware.js';
import {AppError} from '../../../utils/errors.js';
import {prisma} from '../../../config/prisma.js';
import {capturePolicySnapshot} from '../../config/services/process-policy.service.js';
import {VEHICLE_SERVICE_TYPES,VEHICLE_SERVICE_RULE_KEYS} from '../../../../../shared/vehicle-service-policy.mjs';
import {validateMaintenanceInput} from './maintenance-input-policy.service.js';
import {serviceCatalog} from '../../../../../shared/reference-catalog.mjs';
import {parseGoogleMapsPoint} from '../../../../../shared/google-maps-point.mjs';
import {assertEvidenceImages} from '../../../utils/evidence-images.js';
import {gpsEvidence} from '../../../utils/gps-evidence.js';

// Satu servis dapat memuat beberapa jenis pekerjaan. Struk dan titik bengkel wajib pada setiap catatan:
// Supir/Kepala Gudang mengambil titik dari perangkat saat servis, sedangkan input Admin (karena petugas lupa absen)
// memakai titik bengkel dari Google Maps dan ditandai sebagai input atas nama.
const serviceTypesOf=data=>[...new Set((data.serviceTypes?.length?data.serviceTypes:[data.serviceType]).filter(Boolean))];
const resolveLocation=raw=>{
  if(!raw)return null;
  if(Number.isFinite(raw.latitude)&&Number.isFinite(raw.longitude))return raw;
  const parsed=parseGoogleMapsPoint(raw.mapsUrl);
  return parsed?{...raw,latitude:parsed.latitude,longitude:parsed.longitude,mapsUrl:parsed.mapsUrl||raw.mapsUrl}:raw;
};

async function assertDriverVehicle(tx,vehicleId,actor){
  if(actor.role!=='SUPIR')return;
  const since=new Date(Date.now()-30*86400000);
  const assigned=await tx.deliveryRoute.findFirst({where:{vehicleId,driverId:actor.id,cancelledAt:null,OR:[{closedAt:null},{date:{gte:since}}]},select:{id:true}});
  if(!assigned)throw new AppError('Supir hanya dapat mencatat servis kendaraan yang ditugaskan kepadanya. Hubungi Kepala Gudang atau Admin.',403);
}

async function locationEvidence(location,actor){
  const proxy=actor.role==='ADMIN';
  if(proxy)return {source:'GOOGLE_MAPS',proxyEntry:true,latitude:location.latitude,longitude:location.longitude,mapsUrl:location.mapsUrl||null};
  if(!location.observedAt)throw new AppError('Titik absen servis wajib diambil dari perangkat saat servis dilakukan. Ambil ulang foto struk dengan GPS aktif.',422);
  const gps=await gpsEvidence({latitude:location.latitude,longitude:location.longitude,accuracy:location.accuracy??undefined,observedAt:location.observedAt});
  return {source:'DEVICE_GPS',proxyEntry:false,latitude:location.latitude,longitude:location.longitude,accuracy:gps?.accuracy??null,observedAt:gps?.observedAt??null,receivedAt:gps?.receivedAt??null};
}

export const recordMaintenance=async(id,data,actor={})=>{
  const types=serviceTypesOf(data);
  const location=resolveLocation(data.location);
  if(!types.length)throw new AppError('Pilih minimal satu jenis servis',400);
  if(!data.receiptPhotoUrl)throw new AppError('Foto struk servis wajib dilampirkan',422);
  if(!location||!Number.isFinite(location.latitude)||!Number.isFinite(location.longitude))throw new AppError('Titik bengkel wajib dilampirkan',422);
  await assertEvidenceImages({photoUrl:data.receiptPhotoUrl});
  const normalized={vehicleId:id,serviceType:types[0],serviceTypes:types,odometerAtService:data.odometerAtService,cost:data.cost??0,workshopName:data.workshopName?.trim()||'',notes:data.notes?.trim()||null,serviceDate:data.serviceDate||null};
  const receiptHash=createHash('sha256').update(data.receiptPhotoUrl).digest('hex');
  const requestHash=createHash('sha256').update(JSON.stringify({...normalized,receiptHash,location:[location.latitude,location.longitude],actorId:actor.id||null})).digest('hex');
  return prisma.$transaction(async tx=>{
   if(actor.id)actor=await freshDomainActor(tx,actor.id,'VEHICLE_MAINTENANCE');
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
   await assertDriverVehicle(tx,id,actor);
   const evidence={...await locationEvidence(location,actor),enteredBy:{id:actor.id||null,name:actor.name||null,role:actor.role||null}};
   const captured=await capturePolicySnapshot(),keys=[...VEHICLE_SERVICE_RULE_KEYS,...VEHICLE_SERVICE_TYPES.map(type=>type.config),'VEHICLE_SERVICE_CATALOG'];
   const policySnapshot={...captured,values:Object.fromEntries(keys.map(key=>[key,captured.values[key]])),requestHash,maintenancePolicy:vehicle.maintenancePolicy};
   let serviceDate;
   for(const serviceType of types)serviceDate=validateMaintenanceInput({...data,serviceType},policySnapshot.values);
   const catalog=serviceCatalog(policySnapshot.values);
   policySnapshot.serviceReferences=types.map(code=>catalog.find(r=>r.code===code));
   policySnapshot.serviceReference=policySnapshot.serviceReferences[0];
   const change={totalKm:Math.max(vehicle.totalKm,data.odometerAtService)};
   for(const serviceType of types){const type=VEHICLE_SERVICE_TYPES.find(t=>t.key===serviceType);if(type)change[type.field]=Math.max(vehicle[type.field],change[type.field]??0,data.odometerAtService);}
   const {serviceTypes:_ignored,...recordFields}=normalized;
   const record=await tx.vehicleServiceRecord.create({data:{...recordFields,serviceTypes:types,serviceDate,requestId:data.requestId,policySnapshot,receiptPhotoUrl:data.receiptPhotoUrl,workshopLatitude:location.latitude,workshopLongitude:location.longitude,evidence}});
   const updatedVehicle=await tx.vehicle.update({where:{id},data:change});
   await tx.auditEvent.create({data:{actorId:actor.id||null,actorName:actor.name||null,action:'VEHICLE_SERVICE_RECORDED',entityType:'VEHICLE_SERVICE',entityId:record.id,before:{totalKm:vehicle.totalKm},after:{vehicleId:id,serviceType:types[0],serviceTypes:types,odometerAtService:data.odometerAtService,serviceDate:serviceDate.toISOString(),totalKm:updatedVehicle.totalKm,evidenceSource:evidence.source,proxyEntry:evidence.proxyEntry,receiptPhotoAttached:true,workshopLatitude:location.latitude,workshopLongitude:location.longitude}}});
   return {record,updatedVehicle};
  });
 };
