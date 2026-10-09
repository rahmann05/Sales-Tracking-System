import {CONFIG_DEFAULTS} from '../../../../../shared/config.mjs';
import {deliveryStopGate} from '../../../../../shared/driver-workspace.mjs';
import {AppError} from '../../../utils/errors.js';
import {processValue} from '../../config/services/process-policy.service.js';
import {policyNotification} from '../../notifications/services/notification-policy.service.js';

export async function lockDestinationRoute(tx,stopId){
 const ref=await tx.deliveryStop.findUnique({where:{id:stopId},select:{deliveryRouteId:true}});
 if(!ref)throw new AppError('Stop pengiriman tidak ditemukan',404);
 await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`route:${ref.deliveryRouteId}`}))`;
}

export async function assertDestinationStart(tx,stop){
 const route=stop.deliveryRoute,values={};
 for(const key of ['DELIVERY_STOP_ORDER','DELIVERY_ALLOW_CONTINUE_WITHOUT_RESULT']){
  // Trips created before these options retain their original free-order behavior.
  values[key]=route.policySnapshot?route.policySnapshot.values?.[key]??CONFIG_DEFAULTS[key]:await processValue(route,key,CONFIG_DEFAULTS[key]);
 }
 const stops=await tx.deliveryStop.findMany({where:{deliveryRouteId:route.id},include:{attendances:true,outlet:{select:{name:true}}}});
 const gate=deliveryStopGate(stops,stop.id,values);
 if(gate.blocked)throw new AppError(gate.reason,409);
 return gate.incomplete;
}

export async function flagIncompleteDestinations(tx,stop,incomplete,driverId){
 if(!incomplete.length)return;
 const route=stop.deliveryRoute,title='Hasil tujuan belum dicatat saat melanjutkan perjalanan';
 for(const previous of incomplete){
  // Every start/result is serialized by the route lock; retries cannot duplicate this flag.
  if(await tx.deliveryIssue.findFirst({where:{routeId:route.id,stopId:previous.id,title}}))continue;
  const owner=await tx.user.findFirst({where:{id:route.createdById,deletedAt:null,role:{in:['ADMIN','KEPALA_GUDANG']}}})
   ||await tx.user.findFirst({where:{deletedAt:null,role:{in:['ADMIN','KEPALA_GUDANG']}},orderBy:{id:'asc'}});
  if(!owner)throw new AppError('Tidak ada Admin atau petugas gudang aktif untuk memeriksa tujuan yang belum lengkap',409);
  const reason=`Driver melanjutkan ke ${stop.outlet?.name||stop.sequence} sementara hasil ${previous.outlet?.name||previous.sequence} belum dicatat. Bukti dan hasil barang tujuan tersebut tetap harus dilengkapi.`,dueAt=new Date(Date.now()+(await processValue(route,'DELIVERY_ISSUE_DEFAULT_HOURS',24))*3600000);
  const issue=await tx.deliveryIssue.create({data:{routeId:route.id,stopId:previous.id,packingListId:previous.packingListId,title,reason,ownerId:owner.id,createdById:driverId,dueAt,history:[{action:'INCOMPLETE_DESTINATION_CONTINUED',actorId:driverId,at:new Date().toISOString(),nextStopId:stop.id}]}});
  await policyNotification(tx,{data:{userId:owner.id,type:'DELIVERY_EXCEPTION',title:`Hasil tujuan belum lengkap · ${route.code}`,message:reason,payload:{routeId:route.id,stopId:previous.id,issueId:issue.id,dueAt:dueAt.toISOString()}}});
 }
}
