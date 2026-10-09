import {prisma} from '../../../config/prisma.js';
import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
import {locationExpired} from '../../../../../shared/location-retention.mjs';
// Telemetry only. Attendance evidence and business history are never removed here.
export async function purgeExpiredLocations({db=prisma,now=Date.now(),userIds,driverIds}={}){
 const policies=new Map(),counts={sales:0,driver:0};
 const hoursFor=async actor=>{const key=`${actor.role}:${actor.supervisorId||''}`;if(!policies.has(key))policies.set(key,(await effectivePolicy(actor)).values.TRACKING_LOCATION_RETENTION_HOURS||0);return policies.get(key);};
 for(const kind of ['sales','driver']){
  let cursor;
  do{
   const sales=kind==='sales',model=sales?db.salesLivePosition:db.deliveryPosition,field=sales?'userId':'routeId';
   const rows=await model.findMany({where:{AND:[...(cursor?[{[field]:{gt:cursor}}]:[]),...(sales&&userIds?[{userId:{in:userIds}}]:[]),...(!sales&&driverIds?[{driverId:{in:driverIds}}]:[])]},orderBy:{[field]:'asc'},take:500,include:sales?{user:{select:{role:true,supervisorId:true}}}:{route:{select:{driver:{select:{role:true,supervisorId:true}}}}}});
   for(const row of rows){const actor=sales?row.user:row.route.driver;if(locationExpired(row,await hoursFor(actor),now)){
    const result=await model.deleteMany({where:{[field]:row[field],receivedAt:row.receivedAt}});counts[kind]+=result.count;
   }}
   cursor=rows.length===500?rows.at(-1)[field]:null;
  }while(cursor);
 }
 return counts;
}
