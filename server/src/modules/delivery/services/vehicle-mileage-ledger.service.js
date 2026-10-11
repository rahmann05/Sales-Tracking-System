import {CONFIG_DEFAULTS} from '../../../../../shared/config.mjs';
import {outletOperationalPoint} from '../../../../../shared/outlet-location.mjs';
import {getDynamicConfig} from '../../config/config.service.js';
import {createVehicleMileagePlan,actualMileageLegWithPoints,km} from './vehicle-mileage-plan.service.js';

export async function mileagePlanForRoute(tx,route){
 if(route.mileagePlan?.version===1)return route.mileagePlan;
 const stops=await tx.deliveryStop.findMany({where:{deliveryRouteId:route.id},orderBy:{sequence:'asc'},include:{outlet:true}});
 const [latitude,longitude]=await Promise.all([getDynamicConfig('DEFAULT_OFFICE_LATITUDE',CONFIG_DEFAULTS.DEFAULT_OFFICE_LATITUDE),getDynamicConfig('DEFAULT_OFFICE_LONGITUDE',CONFIG_DEFAULTS.DEFAULT_OFFICE_LONGITUDE)]);
 const plan=await createVehicleMileagePlan(stops.map(stop=>({sequence:stop.sequence,outletId:stop.outletId,packingListId:stop.packingListId,point:stop.targetLatitude!=null&&stop.targetLongitude!=null?{latitude:stop.targetLatitude,longitude:stop.targetLongitude,source:stop.targetPointSource||'LEGACY_SNAPSHOT'}:(()=>{const point=outletOperationalPoint(stop.outlet);return point.latitude!=null&&point.longitude!=null?{...point,source:'LEGACY_LIVE_MASTER'}:null;})()})),{
  office:{latitude:Number(latitude),longitude:Number(longitude)},
  roadResolver:async()=>{throw new Error('Legacy route has no road-distance snapshot');},allowPending:true,
 });
 return {...plan,source:'LEGACY_ROAD_PENDING',actualDeparture:route.mileagePlan?.actualDeparture||null,actualReturn:route.mileagePlan?.actualReturn||null};
}
const lastDestination=history=>[...(history||[])].reverse().find(event=>event.action==='MILEAGE_CHECKPOINT'&&['IN','STOP_RESULT'].includes(event.kind)&&event.targetOutletId);
const targetPoint=(plan,outletId,sequence)=>plan.points.find(point=>point.outletId===outletId&&(sequence==null||point.sequence===sequence))||null;
const lastPoint=(plan,event)=>event?.gps||event?.toPoint||event?.targetPoint||targetPoint(plan,event?.targetOutletId);
async function vehicleFor(tx,route){
 await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`vehicle:${route.vehicleId}`}))`;
 return tx.vehicle.findUnique({where:{id:route.vehicleId}});
}
export async function recordMileageCheckpoint(tx,{routeId,stopId,attendanceId=null,kind,driverId,gps=null,deviationMeters=null}){
 const route=await tx.deliveryRoute.findUnique({where:{id:routeId}});
 const stop=await tx.deliveryStop.findUnique({where:{id:stopId}});
 const vehicle=await vehicleFor(tx,route),initialPlan=await mileagePlanForRoute(tx,route);
 const actor=await tx.user.findUnique({where:{id:driverId},select:{name:true}});
 const history=Array.isArray(route.history)?route.history:[];
 const previous=lastDestination(history);
 const isArrival=kind==='IN'||kind==='STOP_RESULT';
 const fromPoint=previous?lastPoint(initialPlan,previous):initialPlan.actualDeparture||initialPlan.depot;
 const toPoint=gps||targetPoint(initialPlan,stop.outletId,stop.sequence);
 const resolved=isArrival?await actualMileageLegWithPoints(initialPlan,previous?.targetOutletId,stop.outletId,{fromPoint,toPoint}):{leg:{distanceKm:0,source:'SAME_DESTINATION'},plan:initialPlan};
 const {leg,plan}=resolved;
 const distanceKm=leg.distanceKm;
 const beforeKm=Math.max(vehicle.estimatedKm,vehicle.totalKm);
 const afterKm=distanceKm==null?beforeKm:km(beforeKm+distanceKm);
 const at=new Date().toISOString();
 const evidence={kind,routeId,stopId,attendanceId,driverId,previousOutletId:previous?.targetOutletId||null,targetOutletId:stop.outletId,distanceKm,source:leg.source,vehicleKmBefore:beforeKm,vehicleKmAfter:afterKm,targetPoint:targetPoint(plan,stop.outletId,stop.sequence),fromPoint:isArrival?fromPoint:null,toPoint:isArrival?toPoint:null,pointBasis:isArrival?(gps?'DRIVER_GPS':'STORE_TARGET_FALLBACK'):null,gps,deviationMeters,at};
 await tx.deliveryRoute.update({where:{id:routeId},data:{mileagePlan:plan,estimatedTravelKm:km(Number(route.estimatedTravelKm||0)+(distanceKm||0)),mileagePendingCount:Number(route.mileagePendingCount||0)+(distanceKm==null?1:0),history:[...history,{action:'MILEAGE_CHECKPOINT',...evidence}]}});
 if(distanceKm!=null&&distanceKm>0)await tx.vehicle.update({where:{id:vehicle.id},data:{estimatedKm:afterKm}});
 if(attendanceId)await tx.deliveryAttendance.update({where:{id:attendanceId},data:{mileageEvidence:evidence}});
 await tx.auditEvent.create({data:{actorId:driverId,actorName:actor?.name||null,action:'VEHICLE_MILEAGE_CHECKPOINT',entityType:'VEHICLE',entityId:vehicle.id,before:{estimatedKm:beforeKm},after:evidence}});
 return evidence;
}
export async function recordMileageReturn(tx,route,driverId){
 const vehicle=await vehicleFor(tx,route),initialPlan=await mileagePlanForRoute(tx,route);
 const actor=await tx.user.findUnique({where:{id:driverId},select:{name:true}});
 const history=Array.isArray(route.history)?route.history:[];
 const previous=lastDestination(history);
 const fromPoint=previous?lastPoint(initialPlan,previous):initialPlan.actualDeparture||initialPlan.depot;
 const toPoint=initialPlan.actualReturn||initialPlan.returnDepot||initialPlan.depot;
 const {leg,plan}=await actualMileageLegWithPoints(initialPlan,previous?.targetOutletId,null,{fromPoint,toPoint});
 const beforeKm=Math.max(vehicle.estimatedKm,vehicle.totalKm);
 const afterKm=leg.distanceKm==null?beforeKm:km(beforeKm+leg.distanceKm);
 const at=new Date().toISOString();
 const evidence={kind:'RETURN',routeId:route.id,driverId,previousOutletId:previous?.targetOutletId||null,targetOutletId:null,distanceKm:leg.distanceKm,source:leg.source,vehicleKmBefore:beforeKm,vehicleKmAfter:afterKm,fromPoint,toPoint,pointBasis:previous?.gps?'DRIVER_GPS':'STORE_TARGET_FALLBACK',depot:plan.depot,at};
 if(leg.distanceKm!=null&&leg.distanceKm>0)await tx.vehicle.update({where:{id:vehicle.id},data:{estimatedKm:afterKm}});
 await tx.auditEvent.create({data:{actorId:driverId,actorName:actor?.name||null,action:'VEHICLE_MILEAGE_RETURN',entityType:'VEHICLE',entityId:vehicle.id,before:{estimatedKm:beforeKm},after:evidence}});
 return {evidence,mileagePlan:plan,estimatedTravelKm:km(Number(route.estimatedTravelKm||0)+(leg.distanceKm||0)),mileagePendingCount:Number(route.mileagePendingCount||0)+(leg.distanceKm==null?1:0),history:[...history,{action:'MILEAGE_RETURN',...evidence}]};
}
