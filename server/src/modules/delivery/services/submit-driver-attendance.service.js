import {automaticIssue} from './automatic-issue.service.js';
import {assertEvidenceImages} from '../../../utils/evidence-images.js';
import {gpsEvidence} from '../../../utils/gps-evidence.js';
import {processValue} from '../../config/services/process-policy.service.js';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { distanceToOutlet } from '../../../utils/geolocation.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { recordStopResult } from './update-stop-status.service.js';
import {lockDestinationRoute,assertDestinationStart,flagIncompleteDestinations} from './destination-policy.service.js';
import {deliveryRequest} from './delivery-request.service.js';
import {recordMileageCheckpoint} from './vehicle-mileage-ledger.service.js';
import {stopDestinationOutlet} from '../../../../../shared/driver-workspace.mjs';
import {outletOperationalPoint} from '../../../../../shared/outlet-location.mjs';
import {inTransaction} from '../../../utils/in-transaction.js';
export const submitDriverAttendance = async(stopId,data,driverId,{db=prisma,sharedVisitIds=[]}={})=>{
  return inTransaction(db,async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
  await lockDestinationRoute(tx,stopId);
  return deliveryRequest(tx,{stopId,data,driverId,kind:'ATTENDANCE'},async()=>{
  const stop=await tx.deliveryStop.findUnique({where:{id:stopId},include:{deliveryRoute:true,outlet:true,attendances:true}});
  if(!stop)throw new AppError('Stop tidak ditemukan',404);
  if(stop.deliveryRoute.driverId!==driverId)throw new AppError('Rute bukan tugas Anda',403);
  if(stop.status!=='PENDING'||stop.deliveryRoute.status!=='IN_TRANSIT'||stop.deliveryRoute.closedAt||stop.deliveryRoute.cancelledAt||stop.deliveryRoute.onHold)throw new AppError('Trip belum berangkat, ditahan, atau sudah ditutup',409);
  const requireGps=await processValue(stop.deliveryRoute,'DELIVERY_REQUIRE_GPS',true);
  if(!['IN','OUT'].includes(data.type)||requireGps&&(!Number.isFinite(data.latitude)||!Number.isFinite(data.longitude))||data.latitude!=null&&Math.abs(data.latitude)>90||data.longitude!=null&&Math.abs(data.longitude)>180)throw new AppError('Jenis absensi atau GPS tidak valid',400);
  if(await processValue(stop.deliveryRoute,'DELIVERY_REQUIRE_PHOTO',true)&&!data.photoUrl)throw new AppError('Foto bukti wajib',400);
  await assertEvidenceImages({photoUrl:data.photoUrl},{entity:stop.deliveryRoute});
  if(stop.attendances.some(a=>a.type===data.type))throw new AppError('Absensi sudah tercatat',409);
  if(data.type==='OUT'&&!stop.attendances.some(a=>a.type==='IN'))throw new AppError('Absen masuk terlebih dahulu',409);
  const distance=distanceToOutlet(data.latitude,data.longitude,stopDestinationOutlet(stop));
  const geofence=await processValue(stop.deliveryRoute,'DELIVERY_REQUIRE_GEOFENCE',false);
  if(geofence&&distance===null)throw new AppError('GPS atau koordinat tujuan belum tersedia untuk membandingkan lokasi.',422);
  const incomplete=data.type==='IN'?await assertDestinationStart(tx,stop,sharedVisitIds):[];
  const attendance=await tx.deliveryAttendance.create({data:{gpsEvidence:await gpsEvidence(data,(key,fallback)=>processValue(stop.deliveryRoute,key,fallback)),deliveryStopId:stopId,driverId,type:data.type,latitude:data.latitude??null,longitude:data.longitude??null,photoUrl:data.photoUrl,notes:data.notes}});
  const reviewThreshold=await getDynamicConfig('DELIVERY_LOCATION_REVIEW_METERS',200);
  if(data.type==='IN'&&distance!=null&&distance>reviewThreshold){
    const point=outletOperationalPoint(stopDestinationOutlet(stop));
    await automaticIssue(tx,{routeId:stop.deliveryRouteId,packingListId:stop.packingListId,stopId,title:'Periksa selisih lokasi toko dan GPS supir',reason:`Selisih lurus GPS absensi dan titik toko ${Math.round(distance)} meter (hanya untuk pemeriksaan, bukan kilometer kendaraan). Periksa foto, akurasi GPS (±${data.accuracy==null?'tidak diketahui':`${Math.round(data.accuracy)} m`}), dan kecocokan titik toko; penyebab belum ditentukan.`,responsibleRole:'ADMIN',createdById:driverId,history:[{action:'LOCATION_DISCREPANCY',actorId:driverId,at:new Date().toISOString(),attendanceId:attendance.id,distanceMeters:distance,thresholdMeters:reviewThreshold,target:{latitude:point.latitude,longitude:point.longitude,source:stop.targetPointSource||'OUTLET_MASTER'},attendance:{latitude:data.latitude,longitude:data.longitude,accuracy:data.accuracy??null},photoUrl:data.photoUrl}]});
  }
  await recordMileageCheckpoint(tx,{routeId:stop.deliveryRouteId,stopId,attendanceId:attendance.id,kind:data.type,driverId,gps:data.latitude!=null&&data.longitude!=null?{latitude:data.latitude,longitude:data.longitude,accuracy:data.accuracy??null}:null,deviationMeters:distance});
  if(data.type==='IN'){
    await tx.deliveryStop.update({where:{id:stopId},data:{arrivedAt:new Date(),latitude:data.latitude??null,longitude:data.longitude??null}});
    await flagIncompleteDestinations(tx,stop,incomplete,driverId);
  }else{
    if(!data.result)throw new AppError('Hasil pengiriman wajib saat absen keluar',400);
    await recordStopResult(tx,stopId,{...data.result,photoUrl:data.photoUrl,notes:data.notes},driverId,{sharedVisitIds});
  }
  return attendance;
  });
},{isolationLevel:'ReadCommitted',timeout:40000});
};
