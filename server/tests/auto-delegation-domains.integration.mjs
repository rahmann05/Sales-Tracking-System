import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {invalidateConfigCache} from '../src/modules/config/services/dynamic-config.service.js';
import {invalidatePolicyCache} from '../src/modules/config/services/policy-resolver.service.js';
import {saveAutoDelegation,runAutoDelegation,autoDelegationCenter,autoDelegationTaskPage} from '../src/modules/config/services/auto-delegation.service.js';
import {assignmentState} from '../src/modules/config/services/assignment-schedule-adapters.js';
import {runAssignmentSchedules} from '../src/modules/config/services/assignment-schedules.service.js';
import {withPolicy} from '../src/modules/config/services/policy-context.service.js';
import {reportClosedOutlet} from '../src/modules/route-changes/services/report-closed-outlet.service.js';
import {routeAction} from '../src/modules/delivery/services/operations.service.js';
import {resolveIdentity} from '../src/modules/roles/role-assignment.service.js';
import {approveOrder} from '../src/modules/orders/services/approve-order.service.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag='auto-domains-'+randomUUID(),users=[],ruleIds=[];let checks=0,cluster,outlet,pjp,order,review,vehicle,packing,route,change;
const saved=await prisma.systemConfig.findUnique({where:{key:'AUTO_DELEGATION_ENABLED'}}),eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
try{
 const person=async role=>{const p=await prisma.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:'unused',role}});users.push(p.id);return p;};
 const admin=await person('ADMIN'),spv=await person('SUPERVISOR'),sales=await person('SALES'),picker=await person('KEPALA_GUDANG'),checker=await person('KEPALA_GUDANG'),driver=await person('SUPIR');
 await prisma.user.update({where:{id:sales.id},data:{supervisorId:spv.id}});
 cluster=await prisma.cluster.create({data:{name:tag,region:'Uji',supervisorId:spv.id}});
 outlet=await prisma.outlet.create({data:{name:tag,address:'Alamat uji',clusterId:cluster.id}});
 pjp=await prisma.pjp.create({data:{userId:sales.id,type:'SALES',date:new Date(),stops:{create:{outletId:outlet.id,sequence:1}}},include:{stops:true}});
 order=await prisma.order.create({data:{pjpStopId:pjp.stops[0].id,createdBy:sales.id,totalValue:100,policySnapshot:{values:{...CONFIG_DEFAULTS,ORDER_APPROVAL_MODE:'SEQUENTIAL'}}}});
 review=await prisma.outletReview.create({data:{outletId:outlet.id,reason:'Fixture validasi',requestedBy:{id:admin.id},policySnapshot:{values:CONFIG_DEFAULTS}}});
 vehicle=await prisma.vehicle.create({data:{code:tag,name:tag,maxCartons:10,maxWeightKg:100,fuelKmPerLiter:10,fuelType:'SOLAR',fuelPricePerLiter:0}});
 packing=await prisma.packingList.create({data:{code:tag,outletId:outlet.id,createdById:admin.id,totalCartons:1,items:[],status:'RELEASED'}});
 route=await prisma.deliveryRoute.create({data:{code:tag,date:new Date(),vehicleId:vehicle.id,driverId:driver.id,createdById:admin.id,totalCartons:1,status:'DRAFT',policySnapshot:{values:{...CONFIG_DEFAULTS,WAREHOUSE_SEPARATE_CHECKER:true,WAREHOUSE_REQUIRE_PICK:true,WAREHOUSE_REQUIRE_CHECK:true,WAREHOUSE_REQUIRE_LOAD:false}}}});
 const stop=await prisma.deliveryStop.create({data:{deliveryRouteId:route.id,packingListId:packing.id,outletId:outlet.id,sequence:1,allocatedCartons:1,allocatedItems:[],rejectedCartons:1}});
 const actor=await resolveIdentity(admin);
 await routeAction(route.id,{action:'ASSIGN_PREPARATION',stage:'PICK',ownerId:picker.id,assignmentRevision:0,dueAt:new Date(Date.now()+86400000).toISOString(),note:'Penyiapan oleh petugas awal'},actor);
 change=await withPolicy({values:{...CONFIG_DEFAULTS,CLOSED_OUTLET_DECISION_MODE:'ADMIN'},versions:[]},()=>reportClosedOutlet(sales.id,pjp.stops[0].id,'Toko tutup fixture'));
 await prisma.systemConfig.upsert({where:{key:'AUTO_DELEGATION_ENABLED'},create:{key:'AUTO_DELEGATION_ENABLED',value:true},update:{value:true}});invalidateConfigCache();invalidatePolicyCache();
 for(const [kind,entityId,candidateIds,expected,durationMinutes] of [
  ['ORDER_REVIEW',order.id,[admin.id,spv.id],spv.id,0],
  ['OUTLET_REVIEW',review.id,[driver.id,admin.id],admin.id,0],
  ['PREPARATION',route.id,[picker.id,checker.id],checker.id,0],
  ['RETURN',stop.id,[sales.id,checker.id],checker.id,0],
  ['ROUTE_REVIEW',change.id,[sales.id,admin.id],admin.id,1],
 ]){
  let cursor=null,found=false;const seen=new Set();
  do{const page=await autoDelegationTaskPage(prisma,kind,cursor,10);if(!page.length)break;for(const item of page){assert.equal(seen.has(item.id),false);seen.add(item.id);if(item.id===entityId)found=true;}cursor=page.at(-1).id;}while(!found);
  eq(found,true);
  const rule=await saveAutoDelegation({revision:0,name:tag+' '+kind,kind,trigger:'UNASSIGNED',enabled:true,priority:10,candidateIds,graceMinutes:0,durationMinutes,dueInHours:24,maxTransfers:1,cooldownMinutes:1,startsAt:null,endsAt:null,reason:'Fixture pengalihan lintas proses'},actor);ruleIds.push(rule.id);
  await runAutoDelegation(Date.now(),{ruleIds:[rule.id],entityIds:[entityId]});
  const actualId=kind==='PREPARATION'?entityId+':CHECK':entityId,state=await assignmentState(prisma,kind,actualId);
  eq(state.ownerId,expected);
  const record=(await autoDelegationCenter(actor)).records.find(r=>r.kind===kind&&r.entityId===actualId);eq(record.state,'APPLIED');
  if(kind==='ORDER_REVIEW'){
   await approveOrder(order.id,spv.id,{assignmentRevision:state.revision});eq((await assignmentState(prisma,kind,actualId)).ownerId,null);
   await runAutoDelegation(Date.now(),{ruleIds:[rule.id],entityIds:[entityId]});eq((await assignmentState(prisma,kind,actualId)).ownerId,admin.id);
   eq((await prisma.systemConfig.findUnique({where:{key:record.key}})).value.state,'SUPERSEDED');
  }
  if(durationMinutes){await runAssignmentSchedules(Date.now()+120000,{ids:[record.scheduleId]});eq((await assignmentState(prisma,kind,actualId)).ownerId,null);}
 }
 console.log(`Auto delegation domains passed: ${checks} assertions; sequential order, optional outlet validation, separate checker, return and route restoration.`);
}finally{
 const jobs=await prisma.systemConfig.findMany({where:{key:{startsWith:'_ASSIGNMENT_SCHEDULE:'},value:{path:['actorId'],equals:users[0]||''}}});
 const records=await prisma.systemConfig.findMany({where:{key:{startsWith:'_AUTO_DELEGATION_CASE:'},value:{path:['ruleId'],string_contains:''}}});
 await prisma.systemConfig.deleteMany({where:{key:{in:[...ruleIds.map(id=>'_AUTO_DELEGATION_RULE:'+id),...jobs.map(j=>j.key),...records.filter(r=>ruleIds.includes(r.value.ruleId)).map(r=>r.key),...(order?['_ORDER_REVIEW:'+order.id]:[]),...(change?['_ROUTE_CHANGE_WORKFLOW:'+change.id]:[])]}}});
 await prisma.auditEvent.deleteMany({where:{actorId:{in:users}}});await prisma.notification.deleteMany({where:{userId:{in:users}}});
 if(change)await prisma.routeChangeRequest.deleteMany({where:{reportedBy:{in:users}}});
 if(order)await prisma.order.delete({where:{id:order.id}});if(review)await prisma.outletReview.delete({where:{id:review.id}});
 if(route){await prisma.deliveryStop.deleteMany({where:{deliveryRouteId:route.id}});await prisma.deliveryRoute.delete({where:{id:route.id}});}
 if(packing)await prisma.packingList.delete({where:{id:packing.id}});if(vehicle)await prisma.vehicle.delete({where:{id:vehicle.id}});
 if(pjp)await prisma.pjp.delete({where:{id:pjp.id}});if(outlet)await prisma.outlet.delete({where:{id:outlet.id}});if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});
 await prisma.user.deleteMany({where:{id:{in:users}}});
 if(saved)await prisma.systemConfig.upsert({where:{key:saved.key},create:{key:saved.key,value:saved.value},update:{value:saved.value}});else await prisma.systemConfig.deleteMany({where:{key:'AUTO_DELEGATION_ENABLED'}});
 invalidateConfigCache();invalidatePolicyCache();await prisma.$disconnect();
}
