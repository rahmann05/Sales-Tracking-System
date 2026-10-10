import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import {config} from '../src/config/index.js';
import {prisma} from '../src/config/prisma.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {profileKey,invalidatePolicyCache} from '../src/modules/config/services/policy-resolver.service.js';
import {pairwiseCases,assertPairwiseCoverage} from './helpers/pairwise.mjs';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname),'Local database only');
const dimensions={role:['ADMIN','SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR'],feature:['ACTIVE','PAUSED','OFF'],attendance:['IN_OUT','IN_ONLY','OPTIONAL'],requirePhoto:[false,true],photo:[false,true],entered:[false,true],allowMissingOut:[false,true]};
const cases=pairwiseCases(dimensions);assertPairwiseCoverage(assert,dimensions,cases);
const tag='pairwise-'+randomUUID(),users=[],packings=[],routes=[],actors={};let cluster,outlet,vehicle,key,checks=0;
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const api=async(actor,path,method,body)=>{
 const res=await fetch(`http://127.0.0.1:${server.address().port}/api/v1${path}`,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt.sign({id:actor.id,tokenVersion:0},config.jwtSecret)},body:JSON.stringify(body)});
 return {status:res.status,body:await res.json()};
};
const eq=(a,b,note)=>{assert.deepEqual(a,b,note);checks++;};
try{
 const spv=await prisma.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:'fixture',role:'SUPERVISOR',permissions:{can_manage_delivery_routes:false}}});users.push(spv.id);actors.SUPERVISOR=spv;
 for(const role of dimensions.role.filter(role=>role!=='SUPERVISOR')){const actor=await prisma.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:'fixture',role,supervisorId:spv.id,permissions:{can_manage_delivery_routes:['ADMIN','KEPALA_GUDANG'].includes(role)}}});users.push(actor.id);actors[role]=actor;}
 cluster=await prisma.cluster.create({data:{name:tag,region:'Fixture'}});outlet=await prisma.outlet.create({data:{name:tag,address:'Fixture',clusterId:cluster.id,latitude:0,longitude:0}});
 vehicle=await prisma.vehicle.create({data:{name:tag,code:tag,maxCartons:10,maxWeightKg:100,fuelKmPerLiter:10,fuelType:'SOLAR',fuelPricePerLiter:0}});
 key=profileKey('TEAM:'+spv.id);
 for(const [index,c] of cases.entries()){
  await prisma.systemConfig.upsert({where:{key},create:{key,value:{}},update:{value:{}}});
  await prisma.systemConfig.update({where:{key},data:{value:{versions:[{revision:index+1,effectiveAt:new Date(0).toISOString(),values:{FEATURE_DELIVERY_MODE:c.feature,FEATURE_NOTIFICATIONS_MODE:'OFF'}}]}}});invalidatePolicyCache();
  const packing=await prisma.packingList.create({data:{code:tag+'-P'+index,outletId:outlet.id,createdById:actors.ADMIN.id,status:'RELEASED',totalCartons:1}});packings.push(packing.id);
  const route=await prisma.deliveryRoute.create({data:{code:tag+'-R'+index,date:new Date(),driverId:actors.SUPIR.id,vehicleId:vehicle.id,createdById:actors.KEPALA_GUDANG.id,status:'IN_TRANSIT',departedAt:new Date(),policySnapshot:{values:{...CONFIG_DEFAULTS,DELIVERY_ATTENDANCE_MODE:c.attendance,DELIVERY_ALLOW_RESULT_WITHOUT_OUT:c.allowMissingOut,DELIVERY_REQUIRE_PHOTO:c.requirePhoto,DELIVERY_REQUIRE_GPS:false,DELIVERY_REQUIRE_GEOFENCE:false}},stops:{create:{outletId:outlet.id,packingListId:packing.id,sequence:1,allocatedCartons:1}}},include:{stops:true}});routes.push(route.id);
  const stop=route.stops[0];
  if(c.entered)await prisma.deliveryAttendance.create({data:{deliveryStopId:stop.id,driverId:actors.SUPIR.id,type:'IN'}});
  const payload={requestId:randomUUID(),status:'DELIVERED',...(c.photo?{photoUrl:'fixture-photo.jpg'}:{}),...(c.allowMissingOut?{missingCheckoutReason:'Fixture exception, no synthetic checkout'}:{})};
  let expected=200;
  if(c.role!=='SUPIR')expected=403;
  else if(c.attendance!=='OPTIONAL'&&!c.entered||c.attendance==='IN_OUT'&&!c.allowMissingOut)expected=409;
  else if(c.requirePhoto&&!c.photo)expected=400;
  const response=await api(actors[c.role],`/delivery/stops/${stop.id}/status`,'PATCH',payload);
  eq(response.status,expected,JSON.stringify(c));
  eq((await prisma.deliveryStop.findUnique({where:{id:stop.id}})).status,expected===200?'DELIVERED':'PENDING',JSON.stringify(c));
  eq(await prisma.deliveryAttendance.count({where:{deliveryStopId:stop.id,type:'OUT'}}),0,'Logical result never invents checkout');
  const creation=await api(actors[c.role],'/delivery/routes','POST',{});
  eq(creation.status,c.feature==='ACTIVE'?['ADMIN','KEPALA_GUDANG'].includes(c.role)?400:403:409,'New trip feature and role gating '+JSON.stringify(c));
 }
 console.log(`C18 pairwise API passed: ${cases.length} cases, ${checks} assertions, complete pair coverage of seven dimensions across all five roles. Coverage is scoped to delivery; it does not prove every module combination.`);
}finally{
 server.closeAllConnections();await new Promise(r=>server.close(r));
 if(key)await prisma.systemConfig.deleteMany({where:{key}});
 await prisma.systemConfig.deleteMany({where:{OR:users.map(id=>({key:{startsWith:`_DELIVERY_REQUEST:${id}:`}}))}});
 await prisma.notification.deleteMany({where:{userId:{in:users}}});await prisma.auditEvent.deleteMany({where:{actorId:{in:users}}});
 await prisma.deliveryIssue.deleteMany({where:{routeId:{in:routes}}});await prisma.deliveryAttendance.deleteMany({where:{deliveryStop:{deliveryRouteId:{in:routes}}}});
 await prisma.deliveryStop.deleteMany({where:{deliveryRouteId:{in:routes}}});await prisma.deliveryRoute.deleteMany({where:{id:{in:routes}}});await prisma.packingList.deleteMany({where:{id:{in:packings}}});
 if(outlet)await prisma.outlet.delete({where:{id:outlet.id}});if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});if(vehicle)await prisma.vehicle.delete({where:{id:vehicle.id}});
 await prisma.user.deleteMany({where:{id:{in:users}}});invalidatePolicyCache();await prisma.$disconnect();
}
