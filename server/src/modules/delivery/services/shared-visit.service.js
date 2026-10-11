import {z} from 'zod';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {deliveryVisitGroups} from '../../../../../shared/driver-workspace.mjs';
import {submitDriverAttendanceSchema,updateStopStatusSchema} from '../delivery.schema.js';
import {submitDriverAttendance} from './submit-driver-attendance.service.js';
import {recordStopResult} from './update-stop-status.service.js';
import {deliveryRequest} from './delivery-request.service.js';
import {lockDestinationRoute} from './destination-policy.service.js';

const schema=z.object({requestId:z.string().uuid(),type:z.enum(['IN','OUT']),logicalResult:z.boolean().optional(),latitude:z.number().optional(),longitude:z.number().optional(),accuracy:z.number().nullable().optional(),observedAt:z.union([z.string(),z.number()]).optional(),photoUrl:z.string().optional(),notes:z.string().max(2000).optional(),stops:z.array(z.object({id:z.string().uuid(),result:z.unknown().optional()})).min(2).max(30)});
export async function submitSharedVisit(stopId,raw,driverId){
 const data=schema.parse(raw),ids=data.stops.map(stop=>stop.id);
 if(ids[0]!==stopId||new Set(ids).size!==ids.length)throw new AppError('Daftar dokumen kunjungan tidak valid.',400);
 return prisma.$transaction(async db=>{
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
  await lockDestinationRoute(db,stopId);
  return deliveryRequest(db,{stopId,data,driverId,kind:'GROUP'},async()=>{
   const first=await db.deliveryStop.findUnique({where:{id:stopId},include:{deliveryRoute:true}});
   if(first.deliveryRoute.driverId!==driverId)throw new AppError('Perjalanan bukan tugas Anda.',403);
   const stops=await db.deliveryStop.findMany({where:{deliveryRouteId:first.deliveryRouteId},include:{outlet:true}});
   const group=deliveryVisitGroups(stops).find(group=>group.stops.some(stop=>stop.id===stopId));
   if(!group||ids.some(id=>!group.stops.some(stop=>stop.id===id))||group.key.startsWith('missing:'))throw new AppError('Bukti bersama hanya untuk dokumen berurutan dengan toko dan titik yang sama.',422);
   const selected=group.stops.filter(stop=>ids.includes(stop.id));
   if(selected.some(stop=>stop.status!=='PENDING'))throw new AppError('Sebagian dokumen sudah memiliki hasil. Perbarui perjalanan.',409);
   // Keep individual documents and quantities, but record one explicitly captured
   // physical visit against all selected documents in one atomic transaction.
   for(const stop of selected){
    const row=data.stops.find(row=>row.id===stop.id);
    if(data.logicalResult){
     if(data.type!=='OUT')throw new AppError('Hasil tanpa presensi hanya untuk penyelesaian pengiriman.',400);
     const result=updateStopStatusSchema.parse({params:{id:stop.id},body:{...row.result,photoUrl:data.photoUrl,notes:data.notes}}).body;
     await recordStopResult(db,stop.id,result,driverId,{sharedVisitIds:ids});
    }else{
     const payload=submitDriverAttendanceSchema.parse({params:{id:stop.id},body:{type:data.type,latitude:data.latitude,longitude:data.longitude,accuracy:data.accuracy,observedAt:data.observedAt,photoUrl:data.photoUrl,notes:data.notes,...(data.type==='OUT'?{result:row.result}:{})}}).body;
     await submitDriverAttendance(stop.id,payload,driverId,{db,sharedVisitIds:ids});
    }
   }
   await db.auditEvent.create({data:{entityType:'DELIVERY_ROUTE',entityId:first.deliveryRouteId,action:'SHARED_VISIT_EVIDENCE',actorId:driverId,before:{},after:{stopIds:ids,type:data.type,requestId:data.requestId,onePhysicalVisit:true}}});
   return db.deliveryStop.findUnique({where:{id:stopId}});
  });
 },{isolationLevel:'ReadCommitted',timeout:60000});
}
