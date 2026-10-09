// Local-only disposable fixtures; published configuration and business records are never changed.
import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {withPolicy} from '../src/modules/config/services/policy-context.service.js';
import {submitDriverAttendance} from '../src/modules/delivery/services/submit-driver-attendance.service.js';
import {updateStopStatus} from '../src/modules/delivery/services/update-stop-status.service.js';
import {routeAction,resolveIssue} from '../src/modules/delivery/services/operations.service.js';

assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname),'Local database only');
const prefix=`driver-policy-${randomUUID()}`,users=[],outlets=[],packings=[],routes=[];
let cluster,vehicle,checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const rejects=async(fn,status)=>{await assert.rejects(fn,e=>e.statusCode===status);checks++;};
const run=fn=>withPolicy({values:{...CONFIG_DEFAULTS,FEATURE_NOTIFICATIONS_MODE:'OFF'},versions:[]},fn);
try{
 const person=async role=>{const u=await prisma.user.create({data:{name:prefix,email:`${randomUUID()}@example.invalid`,password:'fixture',role}});users.push(u.id);return u;};
 const warehouse=await person('KEPALA_GUDANG'),driver=await person('SUPIR'),foreign=await person('SUPIR');
 cluster=await prisma.cluster.create({data:{name:prefix,region:'Fixture'}});
 vehicle=await prisma.vehicle.create({data:{code:prefix,name:prefix,maxCartons:10,maxWeightKg:100,fuelKmPerLiter:10,fuelType:'SOLAR',fuelPricePerLiter:10000}});
 for(let i=0;i<3;i++){
  const o=await prisma.outlet.create({data:{name:`${prefix}-${i}`,address:'Fixture',latitude:0,longitude:0,clusterId:cluster.id}});outlets.push(o.id);
 }
 const makeRoute=async(values)=>{
  const manifest=[];
  for(const outletId of outlets){const p=await prisma.packingList.create({data:{code:`${prefix}-P${packings.length}`,outletId,createdById:warehouse.id,totalCartons:1,status:'RELEASED'}});packings.push(p.id);manifest.push(p.id);}
  const route=await prisma.deliveryRoute.create({data:{code:`${prefix}-${routes.length}`,date:new Date(),vehicleId:vehicle.id,driverId:driver.id,createdById:warehouse.id,status:'IN_TRANSIT',departedAt:new Date(),totalCartons:3,policySnapshot:{values:{...CONFIG_DEFAULTS,DELIVERY_REQUIRE_GPS:false,DELIVERY_REQUIRE_PHOTO:false,DELIVERY_REQUIRE_GEOFENCE:false,TRIP_REQUIRE_ODOMETER:false,TRIP_REQUIRE_DOCUMENT_RETURN:false,...values}},stops:{create:outlets.map((outletId,i)=>({outletId,packingListId:manifest[i],sequence:i+1,allocatedCartons:1}))}},include:{stops:{orderBy:{sequence:'asc'}}}});
  routes.push(route.id);return route;
 };
 const enter=(stop,id=driver.id)=>run(()=>submitDriverAttendance(stop.id,{type:'IN'},id));
 const finish=stop=>run(()=>submitDriverAttendance(stop.id,{type:'OUT',result:{status:'DELIVERED'}},driver.id));
 const strict=await makeRoute({DELIVERY_STOP_ORDER:'SEQUENTIAL'}),[a,b,c]=strict.stops;
 await rejects(()=>enter(b),409);eq(await prisma.deliveryAttendance.count({where:{deliveryStopId:b.id}}),0);
 await rejects(()=>enter(a,foreign.id),403);
 await enter(a);await rejects(()=>enter(b),409);await finish(a);await enter(b);await finish(b);await enter(c);await finish(c);
 eq((await prisma.deliveryRoute.findUnique({where:{id:strict.id}})).status,'COMPLETED');
 const blocked=await makeRoute({DELIVERY_STOP_ORDER:'FREE',DELIVERY_ALLOW_CONTINUE_WITHOUT_RESULT:false});
 await enter(blocked.stops[1]);await rejects(()=>enter(blocked.stops[0]),409);await finish(blocked.stops[1]);await enter(blocked.stops[0]);
 eq(await prisma.deliveryIssue.count({where:{routeId:blocked.id}}),0);
 const permissive=await makeRoute({DELIVERY_STOP_ORDER:'FREE',DELIVERY_ALLOW_CONTINUE_WITHOUT_RESULT:true});
 await enter(permissive.stops[0]);await enter(permissive.stops[1]);
 eq(await prisma.deliveryAttendance.count({where:{deliveryStopId:permissive.stops[0].id,type:'OUT'}}),0);
 eq((await prisma.deliveryStop.findUnique({where:{id:permissive.stops[0].id}})).status,'PENDING');
 let flags=await prisma.deliveryIssue.findMany({where:{routeId:permissive.id}});eq(flags.length,1);eq(flags[0].ownerId,warehouse.id);
 await rejects(()=>run(()=>routeAction(permissive.id,{action:'RETURN',note:'Tidak boleh melewati hasil barang'},driver)),409);
 await rejects(()=>run(()=>resolveIssue(flags[0].id,'Mengakui sendiri',driver)),403);
 await run(()=>resolveIssue(flags[0].id,'Diperiksa gudang, driver tetap wajib melengkapi hasil',warehouse));
 await enter(permissive.stops[2]);flags=await prisma.deliveryIssue.findMany({where:{routeId:permissive.id}});eq(flags.length,2);eq(flags.filter(i=>i.stopId===permissive.stops[0].id).length,1);
 for(const stop of permissive.stops)await finish(stop);
 eq((await prisma.deliveryRoute.findUnique({where:{id:permissive.id}})).status,'COMPLETED');
 await run(()=>routeAction(permissive.id,{action:'RETURN',note:'Kembali setelah seluruh hasil dicatat'},driver));
 await rejects(()=>run(()=>routeAction(permissive.id,{action:'CLOSE',note:'Kendala masih perlu pemeriksaan'},warehouse)),409);
 for(const issue of flags.filter(i=>i.status==='OPEN'))await run(()=>resolveIssue(issue.id,'Hasil tujuan telah dilengkapi dan diperiksa',warehouse));
 await run(()=>routeAction(permissive.id,{action:'CLOSE',note:'Pemeriksaan selesai'},warehouse));
 const direct=await makeRoute({DELIVERY_ATTENDANCE_MODE:'OPTIONAL',DELIVERY_STOP_ORDER:'SEQUENTIAL'});
 await rejects(()=>run(()=>updateStopStatus(direct.stops[1].id,{status:'DELIVERED'},driver.id)),409);
 for(const stop of direct.stops)await run(()=>updateStopStatus(stop.id,{status:'DELIVERED'},driver.id));
 eq(await prisma.deliveryAttendance.count({where:{deliveryStopId:{in:direct.stops.map(s=>s.id)}}}),0);
 eq((await prisma.deliveryRoute.findUnique({where:{id:direct.id}})).status,'COMPLETED');
 // Missing checkout is an explicit frozen exception, never a synthetic OUT.
 const noException=await makeRoute({DELIVERY_ATTENDANCE_MODE:'IN_OUT',DELIVERY_ALLOW_RESULT_WITHOUT_OUT:false});
 await enter(noException.stops[0]);
 await rejects(()=>run(()=>updateStopStatus(noException.stops[0].id,{status:'DELIVERED',missingCheckoutReason:'GPS ponsel berhenti'},driver.id)),409);
 eq(await prisma.deliveryIssue.count({where:{routeId:noException.id}}),0);
 eq((await prisma.deliveryStop.findUnique({where:{id:noException.stops[0].id}})).status,'PENDING');
 const exception=await makeRoute({DELIVERY_ATTENDANCE_MODE:'IN_OUT',DELIVERY_ALLOW_RESULT_WITHOUT_OUT:true,DELIVERY_STOP_ORDER:'SEQUENTIAL'}),[first,...rest]=exception.stops;
 await rejects(()=>run(()=>updateStopStatus(first.id,{status:'DELIVERED',missingCheckoutReason:'GPS ponsel berhenti'},driver.id)),409);
 await enter(first);
 await rejects(()=>run(()=>updateStopStatus(first.id,{status:'DELIVERED'},driver.id)),400);
 await rejects(()=>run(()=>updateStopStatus(first.id,{status:'DELIVERED',missingCheckoutReason:'x'},driver.id)),400);
 await rejects(()=>run(()=>updateStopStatus(first.id,{status:'DELIVERED',missingCheckoutReason:'GPS ponsel berhenti'},foreign.id)),403);
 await rejects(()=>run(()=>updateStopStatus(first.id,{status:'PARTIAL_REJECT',missingCheckoutReason:'GPS ponsel berhenti'},driver.id)),400);
 eq(await prisma.deliveryIssue.count({where:{routeId:exception.id}}),0);
 eq((await prisma.deliveryStop.findUnique({where:{id:first.id}})).status,'PENDING');
 await run(()=>updateStopStatus(first.id,{status:'DELIVERED',missingCheckoutReason:'GPS ponsel berhenti'},driver.id));
 eq(await prisma.deliveryAttendance.count({where:{deliveryStopId:first.id,type:'OUT'}}),0);
 eq(await prisma.deliveryAttendance.count({where:{deliveryStopId:first.id,type:'IN'}}),1);
 let missingIssue=await prisma.deliveryIssue.findMany({where:{routeId:exception.id}});
 eq(missingIssue.length,1);eq(missingIssue[0].ownerId,warehouse.id);eq(missingIssue[0].reason,'GPS ponsel berhenti');eq(missingIssue[0].history[0].action,'RESULT_WITHOUT_CHECKOUT');
 await rejects(()=>run(()=>updateStopStatus(first.id,{status:'DELIVERED',missingCheckoutReason:'GPS ponsel berhenti'},driver.id)),409);
 eq(await prisma.deliveryIssue.count({where:{routeId:exception.id}}),1);
 for(const stop of rest){await enter(stop);await finish(stop);}
 eq((await prisma.deliveryRoute.findUnique({where:{id:exception.id}})).status,'COMPLETED');
 await run(()=>routeAction(exception.id,{action:'RETURN',note:'Kembali dengan hasil dan pengecualian bukti'},driver));
 await rejects(()=>run(()=>routeAction(exception.id,{action:'CLOSE',note:'Bukti belum diperiksa'},warehouse)),409);
 await rejects(()=>run(()=>resolveIssue(missingIssue[0].id,'Driver mengakui sendiri',driver)),403);
 await run(()=>resolveIssue(missingIssue[0].id,'Gudang mengonfirmasi penerimaan, GPS Driver terputus',warehouse));
 await run(()=>routeAction(exception.id,{action:'CLOSE',note:'Hasil dan pengecualian telah diperiksa'},warehouse));
 eq((await prisma.deliveryIssue.findUnique({where:{id:missingIssue[0].id}})).status,'DONE');
 // Old trip snapshots do not inherit a newly enabled escape hatch.
 const legacy=await makeRoute({DELIVERY_ATTENDANCE_MODE:'IN_OUT'});
 const oldValues={...legacy.policySnapshot.values};delete oldValues.DELIVERY_ALLOW_RESULT_WITHOUT_OUT;
 await prisma.deliveryRoute.update({where:{id:legacy.id},data:{policySnapshot:{values:oldValues}}});
 await enter(legacy.stops[0]);
 await rejects(()=>withPolicy({values:{...CONFIG_DEFAULTS,DELIVERY_ALLOW_RESULT_WITHOUT_OUT:true},versions:[]},()=>updateStopStatus(legacy.stops[0].id,{status:'DELIVERED',missingCheckoutReason:'GPS ponsel berhenti'},driver.id)),409);
 const photographed=await makeRoute({DELIVERY_ALLOW_RESULT_WITHOUT_OUT:true,DELIVERY_REQUIRE_PHOTO:true});
 const photographedStop=photographed.stops[0];
 await run(()=>submitDriverAttendance(photographedStop.id,{type:'IN',photoUrl:'fixture-arrival.jpg'},driver.id));
 await rejects(()=>run(()=>updateStopStatus(photographedStop.id,{status:'DELIVERED',missingCheckoutReason:'GPS ponsel berhenti'},driver.id)),400);
 eq(await prisma.deliveryIssue.count({where:{routeId:photographed.id}}),0);
 const results=await Promise.allSettled([1,2].map(()=>run(()=>updateStopStatus(photographedStop.id,{status:'DELIVERED',missingCheckoutReason:'GPS ponsel berhenti',photoUrl:'fixture-result.jpg'},driver.id))));
 eq(results.filter(r=>r.status==='fulfilled').length,1);
 eq(await prisma.deliveryIssue.count({where:{routeId:photographed.id}}),1);
 eq(await prisma.deliveryAttendance.count({where:{deliveryStopId:photographedStop.id,type:'OUT'}}),0);
 eq((await prisma.deliveryStop.findUnique({where:{id:photographedStop.id}})).photoUrl,'fixture-result.jpg');
 console.log(`PASS ${checks} destination policy assertions; no published configurations changed.`);
}finally{
 await prisma.deliveryIssue.deleteMany({where:{routeId:{in:routes}}});
 await prisma.deliveryRoute.deleteMany({where:{id:{in:routes}}});
 await prisma.packingList.deleteMany({where:{id:{in:packings}}});
 await prisma.notification.deleteMany({where:{userId:{in:users}}});
 if(vehicle)await prisma.vehicle.delete({where:{id:vehicle.id}});
 await prisma.outlet.deleteMany({where:{id:{in:outlets}}});
 if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});
 await prisma.user.deleteMany({where:{id:{in:users}}});
 await prisma.$disconnect();
}
