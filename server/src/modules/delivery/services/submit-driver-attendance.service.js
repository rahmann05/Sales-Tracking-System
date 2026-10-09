import {gpsEvidence} from '../../../utils/gps-evidence.js';
import {processValue} from '../../config/services/process-policy.service.js';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { calculateDistanceMeters } from '../../../utils/geolocation.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { recordStopResult } from './update-stop-status.service.js';
import {lockDestinationRoute,assertDestinationStart,flagIncompleteDestinations} from './destination-policy.service.js';
export const submitDriverAttendance = async(stopId,data,driverId)=>{
  return prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
  await lockDestinationRoute(tx,stopId);
  const stop=await tx.deliveryStop.findUnique({where:{id:stopId},include:{deliveryRoute:true,outlet:true,attendances:true}});
  if(!stop)throw new AppError('Stop tidak ditemukan',404);
  if(stop.deliveryRoute.driverId!==driverId)throw new AppError('Rute bukan tugas Anda',403);
  if(stop.status!=='PENDING'||stop.deliveryRoute.status!=='IN_TRANSIT'||stop.deliveryRoute.closedAt||stop.deliveryRoute.cancelledAt||stop.deliveryRoute.onHold)throw new AppError('Trip belum berangkat, ditahan, atau sudah ditutup',409);
  const requireGps=await processValue(stop.deliveryRoute,'DELIVERY_REQUIRE_GPS',true);
  if(!['IN','OUT'].includes(data.type)||requireGps&&(!Number.isFinite(data.latitude)||!Number.isFinite(data.longitude))||data.latitude!=null&&Math.abs(data.latitude)>90||data.longitude!=null&&Math.abs(data.longitude)>180)throw new AppError('Jenis absensi atau GPS tidak valid',400);
  if(await processValue(stop.deliveryRoute,'DELIVERY_REQUIRE_PHOTO',true)&&!data.photoUrl)throw new AppError('Foto bukti wajib',400);
  if(stop.attendances.some(a=>a.type===data.type))throw new AppError('Absensi sudah tercatat',409);
  if(data.type==='OUT'&&!stop.attendances.some(a=>a.type==='IN'))throw new AppError('Absen masuk terlebih dahulu',409);
  if(await processValue(stop.deliveryRoute,'DELIVERY_REQUIRE_GEOFENCE',false) && calculateDistanceMeters(data.latitude,data.longitude,stop.outlet.latitude,stop.outlet.longitude)>(stop.outlet.radiusMeters||await getDynamicConfig('ATTENDANCE_RADIUS_METERS',50)))throw new AppError('Posisi di luar radius toko',422);
  const incomplete=data.type==='IN'?await assertDestinationStart(tx,stop):[];
  const attendance=await tx.deliveryAttendance.create({data:{gpsEvidence:await gpsEvidence(data,(key,fallback)=>processValue(stop.deliveryRoute,key,fallback)),deliveryStopId:stopId,driverId,type:data.type,latitude:data.latitude??null,longitude:data.longitude??null,photoUrl:data.photoUrl,notes:data.notes}});
  if(data.type==='IN'){
    await tx.deliveryStop.update({where:{id:stopId},data:{arrivedAt:new Date(),latitude:data.latitude??null,longitude:data.longitude??null}});
    await flagIncompleteDestinations(tx,stop,incomplete,driverId);
  }else{
    if(!data.result)throw new AppError('Hasil pengiriman wajib saat absen keluar',400);
    await recordStopResult(tx,stopId,{...data.result,photoUrl:data.photoUrl,notes:data.notes},driverId);
  }
  return attendance;
},{isolationLevel:'Serializable'});
};
