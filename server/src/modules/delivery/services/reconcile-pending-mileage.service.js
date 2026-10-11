import {prisma} from '../../../config/prisma.js';
import {actualMileageLegWithPoints,createVehicleMileagePlan,km} from './vehicle-mileage-plan.service.js';

const pendingEvent=event=>['MILEAGE_CHECKPOINT','MILEAGE_RETURN'].includes(event?.action)&&event.distanceKm==null;

export async function reconcilePendingRoadPlans({db=prisma,limit=5,roadResolver}={}){
 const routes=await db.deliveryRoute.findMany({where:{totalDistanceKm:null,mileagePlan:{path:['source'],equals:'ROAD_PENDING'}},orderBy:{updatedAt:'asc'},take:limit,select:{id:true,updatedAt:true,mileagePlan:true}});
 let resolved=0;
 for(const snapshot of routes){
  const previous=snapshot.mileagePlan;
  if(previous?.source!=='ROAD_PENDING'||!previous.depot||!previous.points?.length)continue;
  let calculated;
  try{
   calculated=await createVehicleMileagePlan(previous.points.map(point=>({sequence:point.sequence,outletId:point.outletId,packingListId:point.packingListId,point})),{office:previous.depot,returnOffice:previous.returnDepot||previous.depot,...(roadResolver?{roadResolver}:{})});
  }catch{
   await db.deliveryRoute.updateMany({where:{id:snapshot.id,updatedAt:snapshot.updatedAt},data:{mileagePlan:{...previous,lastPlanRetryAt:new Date().toISOString()}}});
   continue;
  }
  const applied=await db.$transaction(async tx=>{
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`route:${snapshot.id}`}))`;
   const route=await tx.deliveryRoute.findUnique({where:{id:snapshot.id},include:{vehicle:{select:{fuelKmPerLiter:true}}}});
   if(!route||route.totalDistanceKm!=null||route.mileagePlan?.source!=='ROAD_PENDING')return false;
   const plan={...route.mileagePlan,source:calculated.source,legs:calculated.legs,totalKm:calculated.totalKm,planResolvedAt:new Date().toISOString()};
   await tx.deliveryRoute.update({where:{id:route.id},data:{mileagePlan:plan,totalDistanceKm:calculated.totalKm,fuelConsumedLiters:route.vehicle?.fuelKmPerLiter>0?calculated.totalKm/route.vehicle.fuelKmPerLiter:null}});
   await tx.auditEvent.create({data:{actorName:'Sistem',action:'DELIVERY_ROAD_PLAN_RECONCILED',entityType:'DELIVERY_ROUTE',entityId:route.id,before:{totalDistanceKm:null},after:{totalDistanceKm:calculated.totalKm,source:calculated.source,closedAt:route.closedAt||null}}});
   return true;
  },{isolationLevel:'Serializable',timeout:15000});
  if(applied)resolved++;
 }
 return {scanned:routes.length,resolved};
}

export async function reconcilePendingMileage({db=prisma,limit=5,roadResolver}={}){
 const plans=await reconcilePendingRoadPlans({db,limit,roadResolver});
 const routes=await db.deliveryRoute.findMany({where:{mileagePendingCount:{gt:0}},orderBy:{updatedAt:'asc'},take:limit,select:{id:true,updatedAt:true,mileagePlan:true,history:true}});
 let resolved=0;
 for(const snapshot of routes){
  const event=(Array.isArray(snapshot.history)?snapshot.history:[]).find(pendingEvent);
  if(!event||!snapshot.mileagePlan?.version)continue;
  const {leg,plan}=await actualMileageLegWithPoints(snapshot.mileagePlan,event.previousOutletId||null,event.action==='MILEAGE_RETURN'?null:event.targetOutletId,{fromPoint:event.fromPoint||undefined,toPoint:event.toPoint||undefined,...(roadResolver?{roadResolver}:{})});
  if(leg.distanceKm==null){await db.deliveryRoute.updateMany({where:{id:snapshot.id,updatedAt:snapshot.updatedAt},data:{mileagePlan:{...snapshot.mileagePlan,lastMileageRetryAt:new Date().toISOString()}}});continue;}
  const applied=await db.$transaction(async tx=>{
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`route:${snapshot.id}`}))`;
   const route=await tx.deliveryRoute.findUnique({where:{id:snapshot.id}});
   const history=Array.isArray(route?.history)?route.history:[];
   const index=history.findIndex(item=>pendingEvent(item)&&item.action===event.action&&item.at===event.at&&item.stopId===event.stopId);
   if(index<0)return false;
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`vehicle:${route.vehicleId}`}))`;
   const vehicle=await tx.vehicle.findUnique({where:{id:route.vehicleId}});
   const laterReconciliation=await tx.auditEvent.findFirst({where:{entityType:'VEHICLE',entityId:route.vehicleId,action:{in:['VEHICLE_MILEAGE_ADMIN_CORRECTION','VEHICLE_MILEAGE_RECONCILED']},createdAt:{gt:new Date(event.at)}},select:{id:true}});
   const applyToVehicle=!laterReconciliation&&!((route.closedAt||route.odometerPostedAt)&&route.odometerEnd!=null);
   const beforeKm=Math.max(vehicle.totalKm,vehicle.estimatedKm);
   const afterKm=applyToVehicle?km(beforeKm+leg.distanceKm):beforeKm;
   const recovered={...history[index],distanceKm:leg.distanceKm,source:leg.source,resolvedAt:new Date().toISOString(),appliedToVehicle:applyToVehicle};
   history[index]=recovered;
   await tx.deliveryRoute.update({where:{id:route.id},data:{history,mileagePlan:{...plan,actualLegs:[...(route.mileagePlan?.actualLegs||[]),...(plan.actualLegs||[]).filter(candidate=>!(route.mileagePlan?.actualLegs||[]).some(old=>old.key?old.key===candidate.key:old.from===candidate.from&&old.to===candidate.to&&!candidate.key))]},estimatedTravelKm:km(Number(route.estimatedTravelKm||0)+leg.distanceKm),mileagePendingCount:Math.max(0,route.mileagePendingCount-1)}});
   if(applyToVehicle)await tx.vehicle.update({where:{id:vehicle.id},data:{estimatedKm:afterKm}});
   if(event.attendanceId)await tx.deliveryAttendance.update({where:{id:event.attendanceId},data:{mileageEvidence:recovered}});
   await tx.auditEvent.create({data:{actorName:'Sistem',action:'VEHICLE_MILEAGE_ROAD_RECONCILED',entityType:'VEHICLE',entityId:vehicle.id,before:{estimatedKm:beforeKm,pendingCount:route.mileagePendingCount},after:{routeId:route.id,attendanceId:event.attendanceId||null,from:event.previousOutletId||'START',to:event.targetOutletId||'RETURN',distanceKm:leg.distanceKm,source:leg.source,estimatedKm:afterKm,appliedToVehicle:applyToVehicle}}});
   return true;
  },{isolationLevel:'Serializable',timeout:15000});
  if(applied)resolved++;
 }
 return {scanned:routes.length,resolved,plans};
}
