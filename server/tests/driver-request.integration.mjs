// Disposable local API fixtures. No published policy, real account, or GPS record is edited.
import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import {config} from '../src/config/index.js';
import {prisma} from '../src/config/prisma.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname),'Local database only');
const tag='driver-retry-'+randomUUID(),users=[],routes=[],packings=[];let cluster,outlet,vehicle,checks=0;
const eq=(actual,expected)=>{assert.deepEqual(actual,expected);checks++;};
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const api=async(actor,path,method='GET',body)=>{
 const res=await fetch(`http://127.0.0.1:${server.address().port}/api/v1${path}`,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt.sign({id:actor.id,tokenVersion:actor.tokenVersion||0},config.jwtSecret)},...(body?{body:JSON.stringify(body)}:{})});
 return {status:res.status,body:await res.json()};
};
try{
 const person=async(role,permissions={})=>{const user=await prisma.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:'fixture',role,permissions}});users.push(user.id);return user;};
 const admin=await person('ADMIN'),warehouse=await person('KEPALA_GUDANG'),driver=await person('SUPIR'),other=await person('SUPIR'),sales=await person('SALES'),spv=await person('SUPERVISOR');
 const deniedDriver=await person('SUPIR',{can_access_driver_map:false}),deniedAdmin=await person('ADMIN',{can_manage_packing_list:false}),deniedSpv=await person('SUPERVISOR',{can_manage_rjp:false});
 cluster=await prisma.cluster.create({data:{name:tag,region:'Fixture'}});
 outlet=await prisma.outlet.create({data:{name:tag,address:'Fixture',clusterId:cluster.id,latitude:0,longitude:0}});
 vehicle=await prisma.vehicle.create({data:{name:tag,code:tag,maxCartons:10,maxWeightKg:100,fuelKmPerLiter:10,fuelType:'SOLAR',fuelPricePerLiter:0}});
 const make=async(mode,extra={})=>{
  const packing=await prisma.packingList.create({data:{code:tag+'-P'+packings.length,outletId:outlet.id,createdById:admin.id,status:'RELEASED',totalCartons:2}});packings.push(packing.id);
  const route=await prisma.deliveryRoute.create({data:{code:tag+'-R'+routes.length,date:new Date(),vehicleId:vehicle.id,driverId:driver.id,createdById:warehouse.id,status:'IN_TRANSIT',departedAt:new Date(),totalCartons:2,policySnapshot:{values:{...CONFIG_DEFAULTS,DELIVERY_ATTENDANCE_MODE:mode,DELIVERY_REQUIRE_GPS:false,DELIVERY_REQUIRE_PHOTO:false,DELIVERY_REQUIRE_GEOFENCE:false,...extra}},stops:{create:{outletId:outlet.id,packingListId:packing.id,sequence:1,allocatedCartons:2}}},include:{stops:true}});
  routes.push(route.id);return {route,stop:route.stops[0],path:`/delivery/stops/${route.stops[0].id}`};
 };
 for(const mode of ['IN_OUT','IN_ONLY','OPTIONAL']){
  const {route,stop,path}=await make(mode);let result;
  if(mode!=='OPTIONAL'){
   const body={requestId:randomUUID(),type:'IN',notes:'Arrival fixture'};
   const responses=await Promise.all([api(driver,path+'/attendance','POST',body),api(driver,path+'/attendance','POST',body)]);
   eq(responses.map(r=>r.status),[201,201]);eq(responses[0].body.data.id,responses[1].body.data.id);
   eq(await prisma.deliveryAttendance.count({where:{deliveryStopId:stop.id,type:'IN'}}),1);
   eq((await api(driver,path+'/attendance','POST',{...body,notes:'Different content'})).status,409);
  }
  const body={requestId:randomUUID(),...(mode==='IN_OUT'?{type:'OUT',result:{status:'DELIVERED'}}:{status:'DELIVERED'})};
  const endpoint=path+(mode==='IN_OUT'?'/attendance':'/status'),method=mode==='IN_OUT'?'POST':'PATCH';
  result=await api(driver,endpoint,method,body);eq(result.status,mode==='IN_OUT'?201:200);
  await prisma.deliveryRoute.update({where:{id:route.id},data:{closedAt:new Date()}});
  const replay=await api(driver,endpoint,method,body);eq(replay.status,result.status);eq(replay.body.data.id,result.body.data.id);
  eq((await api(driver,path+'/requests/'+body.requestId)).body.data.confirmed,true);
  eq((await api(other,path+'/requests/'+body.requestId)).status,404);
  eq((await api(other,endpoint,method,body)).status,403);
  eq((await api(driver,endpoint,method,{...body,notes:'Changed after confirmation'})).status,409);
  eq((await api(driver,endpoint,method,{...body,requestId:randomUUID()})).status,409);
  eq(await prisma.deliveryAttendance.count({where:{deliveryStopId:stop.id,type:'OUT'}}),mode==='IN_OUT'?1:0);
 }
 const rejected=await make('OPTIONAL'),body={requestId:randomUUID(),status:'REJECTED',rejectReason:'Fixture customer refusal'};
 const rejections=await Promise.all([api(driver,rejected.path+'/status','PATCH',body),api(driver,rejected.path+'/status','PATCH',body)]);
 eq(rejections.map(r=>r.status),[200,200]);eq(await prisma.deliveryIssue.count({where:{stopId:rejected.stop.id}}),1);
 eq((await api(driver,rejected.path+'/requests/'+randomUUID())).body.data.confirmed,false);
 const gps=await make('IN_OUT',{DELIVERY_REQUIRE_GPS:true,GPS_REQUIRE_METADATA:true,GPS_MAX_AGE_SECONDS:120});
 const stale={requestId:randomUUID(),type:'IN',latitude:0,longitude:0,accuracy:1,observedAt:new Date(Date.now()-3600000).toISOString()};
 eq((await api(driver,gps.path+'/attendance','POST',stale)).status,422);
 eq((await api(driver,gps.path+'/requests/'+stale.requestId)).body.data.confirmed,false);
 eq(await prisma.deliveryAttendance.count({where:{deliveryStopId:gps.stop.id}}),0);
 const fresh={...stale,observedAt:new Date().toISOString()};eq((await api(driver,gps.path+'/attendance','POST',fresh)).status,201);
 await prisma.deliveryRoute.update({where:{id:gps.route.id},data:{closedAt:new Date()}});
 eq((await api(driver,gps.path+'/attendance','POST',fresh)).status,201);
 for(const actor of [admin,warehouse,sales,spv,deniedDriver])eq((await api(actor,gps.path+'/requests/'+fresh.requestId)).status,403);
 eq((await api(deniedDriver,'/delivery/routes/'+gps.route.id+'/actions','POST',{action:'RETURN',note:'Denied fixture'})).status,403);
 eq((await api(deniedDriver,'/delivery/routes/'+gps.route.id+'/location','POST',{})).status,403);
 eq((await api(deniedAdmin,'/delivery/packing-lists/'+packings[0]+'/status','PATCH',{action:'RECALL'})).status,403);
 eq((await api(deniedAdmin,'/delivery/packing-lists/'+packings[0],'PUT',{})).status,403);
 eq((await api(deniedSpv,'/pjp/planning')).status,403);
 console.log(`C13/C15/C18 request retry passed: ${checks} assertions across all five roles, three attendance modes, concurrency, conflicts, GPS rollback, closed-trip replay and explicit permission denial.`);
}finally{
 server.closeAllConnections();await new Promise(r=>server.close(r));
 await prisma.systemConfig.deleteMany({where:{OR:users.map(id=>({key:{startsWith:`_DELIVERY_REQUEST:${id}:`}}))}});
 await prisma.notification.deleteMany({where:{userId:{in:users}}});await prisma.auditEvent.deleteMany({where:{actorId:{in:users}}});
 await prisma.deliveryIssue.deleteMany({where:{routeId:{in:routes}}});await prisma.deliveryAttendance.deleteMany({where:{deliveryStop:{deliveryRouteId:{in:routes}}}});
 await prisma.deliveryStop.deleteMany({where:{deliveryRouteId:{in:routes}}});await prisma.deliveryRoute.deleteMany({where:{id:{in:routes}}});await prisma.packingList.deleteMany({where:{id:{in:packings}}});
 if(outlet)await prisma.outlet.delete({where:{id:outlet.id}});if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});if(vehicle)await prisma.vehicle.delete({where:{id:vehicle.id}});
 await prisma.user.deleteMany({where:{id:{in:users}}});await prisma.$disconnect();
}
