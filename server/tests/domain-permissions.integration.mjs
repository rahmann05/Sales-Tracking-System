import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {DOMAIN_PERMISSIONS,CORE_ADMIN_ACTIONS} from '../../shared/domain-permissions.mjs';
import {ALL_PERMISSIONS} from '../src/modules/roles/roles.constants.js';
import {reviewPeople,assertReviewersRemain} from '../src/modules/config/services/approval-readiness.service.js';
import {freshDomainActor} from '../src/middlewares/domain-permission.middleware.js';
import {resolveOperationalException} from '../src/modules/attention/operational-exceptions.service.js';
import {withPolicy} from '../src/modules/config/services/policy-context.service.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {checkOut} from '../src/modules/absensi/services/check-out.service.js';
import {recordShift} from '../src/modules/staff-attendance/shift.service.js';
import {createIssue,resolveIssue} from '../src/modules/delivery/services/operations.service.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname),'Local fixtures only');
const tag='domain-access-'+randomUUID(),ids=[],productIds=[],exceptions=[],issueIds=[];let pjp,cluster,outlet,checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;},reject=async(fn,status)=>{await assert.rejects(fn,e=>e.statusCode===status);checks++;};
const allGrants=Object.fromEntries(ALL_PERMISSIONS.map(p=>[p.key,true]));
let roleBaseline,rolesChanged=false,customChecks=0;
const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const token=user=>jwt.sign({id:user.id,tokenVersion:user.tokenVersion||0},config.jwtSecret);
const request=async(user,path,method='GET',body,auth=token(user))=>{const res=await fetch(`http://127.0.0.1:${server.address().port}/api/v1${path}`,{method,headers:{Authorization:'Bearer '+auth,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:res.status,data:await res.json()};};
const fake=randomUUID(),cases={
 START_SHIFT:['/staff-attendance','POST',{action:'SHIFT_IN'}],SALES_VISIT:[`/absensi/${fake}/in`,'POST',{}],OFF_PJP:['/absensi/off-pjp','POST',{}],SPV_VISIT:['/staff-attendance','POST',{action:'VISIT_IN'}],
 REQUEST_EXCEPTION:[`/outlets/${fake}/unlock-request`,'POST',{}],CREATE_PRODUCT:['/products','POST',{}],MANAGE_PRODUCT:[`/products/${fake}`,'PATCH',{}],MANAGE_DIVISION:['/divisions','POST',{}],
 MANAGE_VEHICLE:['/vehicles','POST',{}],VEHICLE_CONDITION:[`/vehicles/${fake}/condition`,'PATCH',{}],VEHICLE_MAINTENANCE:[`/vehicles/${fake}/maintenance`,'POST',{}],VEHICLE_POLICY:[`/vehicles/${fake}/service-policy`,'PATCH',{}],
 INVOICE_CORRECTION:[`/delivery/packing-lists/${fake}/invoices`,'PATCH',{}],INVOICE_RECONCILIATION:[`/delivery/packing-lists/${fake}/reconciliation`,'POST',{}],ASSIGN_TEAM:[`/teams/${fake}`,'PATCH',{}],
 REPORT_TARGET:['/reports/targets','PUT',{}],REPORT_CALENDAR:['/reports/calendar','PUT',{}],REPORT_ARCHIVE:['/reports/archives','POST',{}],RESOLVE_DELIVERY_ISSUE:[`/delivery/issues/${fake}/resolve`,'PATCH',{}],
 SYSTEM:['/config','PUT',{}],USERS:['/users','POST',{}],ROLES:['/roles','POST',{}],
};
try{
 const people={};for(const role of ['ADMIN','SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR']){const user=await prisma.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:'fixture',role,permissions:allGrants}});ids.push(user.id);people[role]=user;}
 const admin=people.ADMIN,spv=people.SUPERVISOR,sales=people.SALES,driver=people.SUPIR;
 await prisma.user.update({where:{id:sales.id},data:{supervisorId:spv.id}});
 const flagged=await prisma.operationalException.create({data:{dedupeKey:tag,kind:'MISSING_OUT',entityId:fake,userId:sales.id,supervisorId:spv.id,details:{source:'TEST'}}});exceptions.push(flagged.id);
 cases.EXCEPTION_REVIEW=[`/attention/exceptions/${flagged.id}`,'PATCH',{decision:'ACKNOWLEDGED',note:'Bukti tidak lengkap telah diperiksa'}];
 for(const [action,rule] of Object.entries({...DOMAIN_PERMISSIONS,...CORE_ADMIN_ACTIONS})){
  const args=cases[action];assert.ok(args,action);
  for(const [role,actor] of Object.entries(people)){
   if(rule.roles.includes(role)){
    await prisma.user.update({where:{id:actor.id},data:{permissions:{...allGrants,[rule.key]:false}}});
    eq((await request(actor,...args)).status,403);
    await prisma.user.update({where:{id:actor.id},data:{permissions:allGrants}});
   }else eq((await request(actor,...args)).status,403);
  }
 }
 // Repeat the real HTTP boundaries with custom definitions for every base role.
 // Only local fixtures; preserve the original role configuration exactly.
 roleBaseline=await prisma.systemConfig.findUnique({where:{key:'ROLE_DEFINITIONS'}});
 const customDefinitions=Object.entries(people).map(([role])=>({code:'TEST_'+role+'_'+tag.replaceAll('-','_').toUpperCase(),name:'Temporary boundary test '+role,baseRole:role,isSystem:false,defaultPermissions:allGrants}));
 await prisma.systemConfig.upsert({where:{key:'ROLE_DEFINITIONS'},create:{key:'ROLE_DEFINITIONS',value:[...(Array.isArray(roleBaseline?.value)?roleBaseline.value:[]),...customDefinitions]},update:{value:[...(Array.isArray(roleBaseline?.value)?roleBaseline.value:[]),...customDefinitions]}});rolesChanged=true;
 for(const definition of customDefinitions){
  const actor=people[definition.baseRole];
  await prisma.user.update({where:{id:actor.id},data:{roleCode:definition.code,permissions:allGrants}});
  const identity=await request(actor,'/auth/me');eq(identity.data.data.role,definition.baseRole);eq(identity.data.data.roleCode,definition.code);customChecks+=2;
  for(const [action,rule] of Object.entries({...DOMAIN_PERMISSIONS,...CORE_ADMIN_ACTIONS})){
   if(rule.roles.includes(definition.baseRole))await prisma.user.update({where:{id:actor.id},data:{permissions:{...allGrants,[rule.key]:false}}});
   eq((await request(actor,...cases[action])).status,403);customChecks++;
   await prisma.user.update({where:{id:actor.id},data:{permissions:allGrants}});
  }
  await prisma.user.update({where:{id:actor.id},data:{roleCode:null}});
 }
 if(roleBaseline)await prisma.systemConfig.update({where:{key:'ROLE_DEFINITIONS'},data:{value:roleBaseline.value,updatedAt:roleBaseline.updatedAt}});else await prisma.systemConfig.delete({where:{key:'ROLE_DEFINITIONS'}});rolesChanged=false;
 // Representative existing middleware: a true permission never expands the base role.
 for(const actor of [driver,people.KEPALA_GUDANG,sales]){
  eq((await request(actor,'/clusters','POST',{})).status,403);
  eq((await request(actor,'/customer-registrations/'+fake+'/approve','PATCH',{})).status,403);
 }
 for(const actor of [driver,people.KEPALA_GUDANG])eq((await request(actor,'/customer-registrations')).status,403);
 const create=await request(admin,'/products','POST',{sku:tag,code:tag,name:tag,price:100,unit:'pack',baseUnit:'pcs',unitsPerUnit:1});eq(create.status,201);productIds.push(create.data.data.id);
 await prisma.user.update({where:{id:admin.id},data:{permissions:{...allGrants,can_manage_products:false}}});
 eq((await request(admin,`/products/${productIds[0]}`,'PATCH',{name:'Changed'})).status,403);eq((await prisma.product.findUnique({where:{id:productIds[0]}})).name,tag);
 await prisma.user.update({where:{id:admin.id},data:{permissions:allGrants}});
 // Fresh service authorization and the exceptional-review permission are independent from manual results.
 await prisma.user.update({where:{id:spv.id},data:{permissions:{...allGrants,can_review_attendance_exception:false}}});
 await reject(()=>resolveOperationalException(flagged.id,{decision:'ACKNOWLEDGED',note:'Periksa bukti kehadiran'},spv),403);
 await reject(()=>prisma.$transaction(db=>freshDomainActor(db,spv.id,'EXCEPTION_REVIEW')),403);
 await prisma.user.update({where:{id:spv.id},data:{permissions:allGrants}});
 const reviewers=await reviewPeople(prisma),withoutRecovery=Object.fromEntries(reviewers.filter(p=>p.role==='ADMIN').map(p=>[p.id,{permissions:{...p.permissions,can_manage_users:false}}]));
 await assert.rejects(()=>assertReviewersRemain(prisma,{patches:withoutRecovery}),e=>e.statusCode===409&&e.message.includes('pemulihan akses'));checks++;
 const withoutException=Object.fromEntries(reviewers.map(p=>[p.id,{permissions:{...p.permissions,can_review_attendance_exception:false}}]));
 await assert.rejects(()=>assertReviewersRemain(prisma,{patches:withoutException}),e=>e.statusCode===409&&e.message.includes('Pengecualian presensi'));checks++;
 // Removing start permissions must not strand an active logical visit or shift.
 cluster=await prisma.cluster.create({data:{name:tag,region:'TEST',supervisorId:spv.id}});outlet=await prisma.outlet.create({data:{name:tag,address:'Jl Uji No 1',clusterId:cluster.id}});
 const values={...CONFIG_DEFAULTS,SALES_ATTENDANCE_MODE:'OPTIONAL',SHIFT_ATTENDANCE_MODE:'OPTIONAL',SALES_VISIT_REQUIRE_RESULT:false,SHIFT_ALLOW_OPEN_VISITS:true,SHIFT_WORKING_DAYS:'0,1,2,3,4,5,6',SHIFT_NON_WORKING_DAY_POLICY:'ALLOW',SHIFT_EARLY_OUT_POLICY:'ALLOW',FEATURE_NOTIFICATIONS_MODE:'OFF'};
 pjp=await prisma.pjp.create({data:{userId:sales.id,type:'SALES',date:new Date(),stops:{create:{outletId:outlet.id,sequence:1,policySnapshot:{values},visitSession:{state:'ACTIVE',startedAt:new Date().toISOString()}}}},include:{stops:true}});
 await prisma.user.update({where:{id:sales.id},data:{permissions:{...allGrants,can_record_sales_visit:false}}});
 const result=await withPolicy({values},()=>checkOut(pjp.stops[0].id,sales.id,null,null,null,{}));eq(result.logical,true);eq(result.visitSession.state,'FINISHED');
 await withPolicy({values},()=>recordShift(sales.id,'SHIFT_IN'));
 await prisma.user.update({where:{id:sales.id},data:{permissions:{...allGrants,can_start_shift:false}}});
 const finishedShift=await withPolicy({values},()=>recordShift(sales.id,'SHIFT_OUT'));eq(finishedShift.checklist.state,'FINISHED');
 const issue=await withPolicy({values},()=>createIssue({title:tag,reason:'Kendala fixture',ownerId:driver.id},admin));issueIds.push(issue.id);
 await reject(()=>prisma.$transaction(db=>assertReviewersRemain(db,{patches:{[driver.id]:{permissions:{...allGrants,can_resolve_delivery_issue:false}}}})),409);
 await prisma.user.update({where:{id:driver.id},data:{permissions:{...allGrants,can_resolve_delivery_issue:false}}});await reject(()=>resolveIssue(issue.id,'Bukti selesai',driver),403);
 await prisma.user.update({where:{id:driver.id},data:{permissions:allGrants}});
 const resolved=await resolveIssue(issue.id,'Kendala sudah ditangani',driver);eq(resolved.status,'DONE');
 // Password reset endpoint must revoke the old JWT and persist a hash.
 const oldJwt=token(sales),reset=await request(admin,`/users/${sales.id}/password`,'PUT',{password:'Fixture-Password-2026!'});eq(reset.status,200);
 eq((await request(sales,'/staff-attendance','GET',undefined,oldJwt)).status,401);eq(await bcrypt.compare('Fixture-Password-2026!',(await prisma.user.findUnique({where:{id:sales.id}})).password),true);
 console.log(`Domain permissions passed: ${checks} assertions (${customChecks} custom-role checks); all action/role boundaries, explicit denials, actual product write, recovery/PIC guards, completion after revocation, fresh service permissions and password session revocation.`);
}finally{
 if(rolesChanged){if(roleBaseline)await prisma.systemConfig.update({where:{key:'ROLE_DEFINITIONS'},data:{value:roleBaseline.value,updatedAt:roleBaseline.updatedAt}});else await prisma.systemConfig.delete({where:{key:'ROLE_DEFINITIONS'}});}
 await prisma.operationalException.deleteMany({where:{id:{in:exceptions}}});await prisma.deliveryIssue.deleteMany({where:{id:{in:issueIds}}});
 await prisma.auditEvent.deleteMany({where:{OR:[{actorId:{in:ids}},{entityId:{in:productIds}}]}});await prisma.notification.deleteMany({where:{userId:{in:ids}}});await prisma.staffActivity.deleteMany({where:{userId:{in:ids}}});
 if(pjp)await prisma.pjp.delete({where:{id:pjp.id}});if(outlet)await prisma.outlet.delete({where:{id:outlet.id}});if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});
 await prisma.product.deleteMany({where:{id:{in:productIds}}});await prisma.user.deleteMany({where:{id:{in:ids}}});await new Promise(resolve=>server.close(resolve));await prisma.$disconnect();
}
