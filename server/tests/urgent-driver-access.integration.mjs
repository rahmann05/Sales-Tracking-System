import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import {config} from '../src/config/index.js';
import {prisma} from '../src/config/prisma.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {assertResources} from '../src/modules/delivery/services/resource-policy.service.js';
import {routeAction} from '../src/modules/delivery/services/operations.service.js';
import {getDrivers} from '../src/modules/delivery/services/get-drivers.service.js';
import {deleteUser} from '../src/modules/users/services/delete-user.service.js';
import {updateUser} from '../src/modules/users/services/update-user.service.js';
import {profileKey,invalidatePolicyCache} from '../src/modules/config/services/policy-resolver.service.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag='urgent-driver-'+randomUUID(),users=[],extraRoutes=[],extraPackings=[];let vehicle,cluster,outlet,packing,route,key,checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;},rejects=async(fn,status)=>{await assert.rejects(fn,e=>e.statusCode===status);checks++;};
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const api=async(actor,path,method='GET',body)=>{const r=await fetch(`http://127.0.0.1:${server.address().port}/api/v1${path}`,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt.sign({id:actor.id,tokenVersion:actor.tokenVersion||0},config.jwtSecret)},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()};};
try{
 const person=async(role,extra={})=>{const u=await prisma.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:'unused',role,...extra}});users.push(u.id);return u;};
 const spv=await person('SUPERVISOR'),admin=await person('ADMIN'),warehouse=await person('KEPALA_GUDANG',{supervisorId:spv.id}),driver=await person('SUPIR',{supervisorId:spv.id}),other=await person('SUPIR',{supervisorId:spv.id}),blocked=await person('SUPIR',{permissions:{can_access_driver_map:false}});
 vehicle=await prisma.vehicle.create({data:{name:tag,code:tag,maxCartons:20,maxWeightKg:100,fuelKmPerLiter:10,fuelType:'SOLAR',fuelPricePerLiter:0}});
 const start=new Date(Date.now()+3600000).toISOString(),end=new Date(Date.now()+7200000).toISOString();
 await rejects(()=>prisma.$transaction(tx=>assertResources(tx,{driverId:blocked.id,vehicleId:vehicle.id,plannedStartAt:start,plannedEndAt:end})),409);
 eq((await getDrivers()).some(p=>p.id===blocked.id),false);
 cluster=await prisma.cluster.create({data:{name:tag,region:'Bandung'}});outlet=await prisma.outlet.create({data:{name:tag,address:'Alamat uji',clusterId:cluster.id,latitude:-6.9,longitude:107.6}});
 packing=await prisma.packingList.create({data:{code:tag,outletId:outlet.id,createdById:admin.id,status:'RELEASED',totalCartons:1,items:[{lineId:'line',name:'Produk uji',quantity:1}]}});
 route=await prisma.deliveryRoute.create({data:{code:tag,date:new Date(),driverId:driver.id,vehicleId:vehicle.id,createdById:warehouse.id,status:'READY',plannedStartAt:start,plannedEndAt:end,policySnapshot:{values:{...CONFIG_DEFAULTS,WAREHOUSE_REQUIRE_PICK:false,WAREHOUSE_REQUIRE_CHECK:false,WAREHOUSE_REQUIRE_LOAD:false,TRIP_REQUIRE_ODOMETER:false,DELIVERY_ATTENDANCE_MODE:'OPTIONAL',DELIVERY_REQUIRE_PHOTO:false},versions:[],at:new Date().toISOString()},stops:{create:{packingListId:packing.id,outletId:outlet.id,sequence:1,allocatedCartons:1,allocatedItems:[{lineId:'line',quantity:1}]}}},include:{stops:true}});
 key=profileKey(`TEAM:${spv.id}`);await prisma.systemConfig.create({data:{key,value:{versions:[{revision:1,effectiveAt:new Date(0).toISOString(),values:{DELIVERY_ATTENDANCE_MODE:'OPTIONAL',DELIVERY_REQUIRE_PHOTO:false}}]}}});invalidatePolicyCache();
 await rejects(()=>deleteUser(driver.id),409);await rejects(()=>updateUser(driver.id,{permissions:{can_access_driver_map:false}}),409);await rejects(()=>updateUser(driver.id,{role:'SALES'}),409);
 await rejects(()=>routeAction(route.id,{action:'RESCHEDULE',note:'Uji Driver pengganti tanpa akses',driverId:blocked.id,plannedStartAt:start,plannedEndAt:end},warehouse),409);
 eq((await routeAction(route.id,{action:'RESCHEDULE',note:'Alihkan ke Driver pengganti yang berwenang',driverId:other.id,plannedStartAt:start,plannedEndAt:end},warehouse)).driverId,other.id);
 eq((await deleteUser(driver.id)).id,driver.id);
 await routeAction(route.id,{action:'START',note:'Mulai trip fixture integrasi'},other);
 await rejects(()=>deleteUser(other.id),409);
 await prisma.systemConfig.update({where:{key},data:{value:{versions:[{revision:2,effectiveAt:new Date(0).toISOString(),values:{FEATURE_DELIVERY_MODE:'OFF',DELIVERY_ATTENDANCE_MODE:'OPTIONAL',DELIVERY_REQUIRE_PHOTO:false}}]}}});invalidatePolicyCache();
 eq((await api(warehouse,'/delivery/routes','POST',{})).status,409);
 eq((await api(other,`/delivery/routes/${route.id}`)).status,200);
 eq((await api(other,`/delivery/stops/${route.stops[0].id}/status`,'PATCH',{status:'DELIVERED',notes:'Seluruh barang fixture diterima'})).status,200);
 eq((await api(other,`/delivery/routes/${route.id}/actions`,'POST',{action:'RETURN',note:'Trip fixture kembali tanpa membuat bukti GPS'})).status,200);
 assert.ok((await prisma.deliveryRoute.findUnique({where:{id:route.id}})).returnedAt);checks++;
 for(const [mode,allowMissingOut] of [['IN_ONLY',false],['IN_OUT',false],['IN_OUT',true]]){
  const pl=await prisma.packingList.create({data:{code:tag+'-'+extraPackings.length,outletId:outlet.id,createdById:admin.id,status:'RELEASED',totalCartons:1}});extraPackings.push(pl.id);
  const r=await prisma.deliveryRoute.create({data:{code:tag+'-'+extraRoutes.length,date:new Date(),driverId:other.id,vehicleId:vehicle.id,createdById:warehouse.id,status:'IN_TRANSIT',departedAt:new Date(),policySnapshot:{values:{...CONFIG_DEFAULTS,TRIP_REQUIRE_ODOMETER:false,DELIVERY_ATTENDANCE_MODE:mode,DELIVERY_ALLOW_RESULT_WITHOUT_OUT:allowMissingOut,DELIVERY_REQUIRE_GPS:false,DELIVERY_REQUIRE_PHOTO:false,DELIVERY_REQUIRE_GEOFENCE:false},versions:[],at:new Date().toISOString()},stops:{create:{packingListId:pl.id,outletId:outlet.id,sequence:1,allocatedCartons:1}}},include:{stops:true}});extraRoutes.push(r.id);
  const stop=r.stops[0],path=`/delivery/stops/${stop.id}/status`;
  eq((await api(other,path,'PATCH',{status:'DELIVERED'})).status,409);
  eq((await api(other,`/delivery/stops/${stop.id}/attendance`,'POST',{type:'IN'})).status,201);
  if(mode==='IN_OUT'&&!allowMissingOut){
   eq((await api(other,path,'PATCH',{status:'DELIVERED'})).status,409);
   eq((await api(other,`/delivery/stops/${stop.id}/attendance`,'POST',{type:'OUT',result:{status:'DELIVERED'}})).status,201);
  }else{
   if(allowMissingOut)eq((await api(other,path,'PATCH',{status:'DELIVERED'})).status,400);
   eq((await api(other,path,'PATCH',{status:'DELIVERED',...(allowMissingOut?{missingCheckoutReason:'Bukti keluar terlewat dalam fixture pengujian'}:{})})).status,200);
   eq(await prisma.deliveryAttendance.count({where:{deliveryStopId:stop.id,type:'OUT'}}),0);
   if(allowMissingOut)eq(await prisma.deliveryIssue.count({where:{stopId:stop.id,title:'Hasil pengiriman dicatat tanpa bukti keluar'}}),1);
  }
  eq((await api(other,`/delivery/routes/${r.id}/actions`,'POST',{action:'RETURN',note:'Kembali setelah seluruh hasil fixture dicatat'})).status,200);
 }
 await updateUser(other.id,{permissions:{can_access_driver_map:false}});
 eq((await api(other,`/delivery/routes/${route.id}`)).status,401);
 console.log(`Urgent C18 driver access passed: ${checks} assertions; disabled feature blocks new trips, existing delivery/return stays available, access cannot strand a driver.`);
}finally{
 server.closeAllConnections();await new Promise(r=>server.close(r));
 await prisma.notification.deleteMany({where:{userId:{in:users}}});await prisma.auditEvent.deleteMany({where:{actorId:{in:users}}});
 if(key)await prisma.systemConfig.deleteMany({where:{key}});
 const routeIds=[...extraRoutes,...(route?[route.id]:[])];await prisma.deliveryIssue.deleteMany({where:{routeId:{in:routeIds}}});await prisma.deliveryAttendance.deleteMany({where:{deliveryStop:{deliveryRouteId:{in:routeIds}}}});await prisma.deliveryStop.deleteMany({where:{deliveryRouteId:{in:routeIds}}});await prisma.deliveryRoute.deleteMany({where:{id:{in:routeIds}}});
 await prisma.packingList.deleteMany({where:{id:{in:extraPackings}}});
 if(packing)await prisma.packingList.delete({where:{id:packing.id}});if(outlet)await prisma.outlet.delete({where:{id:outlet.id}});if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});if(vehicle)await prisma.vehicle.delete({where:{id:vehicle.id}});await prisma.user.deleteMany({where:{id:{in:users}}});invalidatePolicyCache();await prisma.$disconnect();
}
