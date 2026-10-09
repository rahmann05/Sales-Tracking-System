import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CONFIG_DEFAULTS,CONFIG_PARAMS,parseConfigValue} from '../../shared/config.mjs';
import {visitPolicy,policyConflicts} from '../../shared/operational-policy.mjs';
import {featureDecision} from '../../shared/feature-policy.mjs';
import {preparationStages,preparationReady} from '../../shared/warehouse-policy.mjs';
import {prisma} from '../src/config/prisma.js';
import {effectivePolicy,publicPolicy} from '../src/modules/config/services/policy-resolver.service.js';
import {invalidateConfigCache} from '../src/modules/config/services/dynamic-config.service.js';
import {withPolicy,currentPolicy} from '../src/modules/config/services/policy-context.service.js';
import {policySnapshot,withProcessPolicy} from '../src/modules/config/services/process-policy.service.js';
import {visitState,visitSalesResult} from '../../shared/visit-metrics.mjs';
import {gpsEvidence} from '../src/utils/gps-evidence.js';
import {orderReviewRole,reviewRoleAllowed,registrationActions} from '../../shared/approval-workflow.mjs';
import {buildPlanCalendar} from '../../shared/pjp-planning.mjs';
import {planningCalendar} from '../src/modules/pjp/services/planning-calendar.service.js';
import {parseAuditItems,auditAnswers,auditItems} from '../../shared/supervision-checklist.mjs';
import {protectAdminRecovery} from '../src/modules/users/services/admin-recovery.service.js';
import {getAllConfigs} from '../src/modules/config/services/get-all-configs.service.js';
import {getConfigByKey} from '../src/modules/config/services/get-config-by-key.service.js';
import {createCameraSession} from '../../client/src/services/cameraSession.mjs';
import {policyImpact} from '../src/modules/config/services/policy-impact.service.js';
import {parameterGuidance} from '../../shared/policy-guidance.mjs';

test('late camera permission responses release tracks after close and never replace a newer stream',async()=>{
 const session=createCameraSession(),stopped=[];
 const stream=id=>({getTracks:()=>[{stop:()=>stopped.push(id)}]});
 let grant;const response=new Promise(resolve=>{grant=resolve;});
 const first=session.begin();const opening=response.then(media=>session.accept(first,media));
 session.stop();grant(stream('closed'));assert.equal(await opening,false);assert.deepEqual(stopped,['closed']);
 const old=session.begin(),newer=session.begin();assert.equal(session.accept(newer,stream('active')),true);
 assert.equal(session.accept(old,stream('stale')),false);assert.deepEqual(stopped,['closed','stale']);
 session.stop();assert.deepEqual(stopped,['closed','stale','active']);
});

test('impact counts include scoped people and unfinished shifts; changed people invalidate preview',async()=>{
 const people=[{id:'sales',role:'SALES',updatedAt:'a'}];
 const empty={findMany:async()=>[]};
 const db={user:{findMany:async()=>people},pjpStop:empty,order:empty,customerRegistration:empty,deliveryRoute:empty,packingList:empty,staffActivity:{findMany:async query=>query.where.kind==='SHIFT'?[{id:'open'},{id:'logical-finished',checklist:{state:'FINISHED'}}]:[]}};
 const first=await policyImpact({},db,'TEAM:spv');assert.equal(first.counts.users,1);assert.equal(first.counts.shifts,1);
 people[0].updatedAt='b';assert.notEqual((await policyImpact({},db,'TEAM:spv')).fingerprint,first.fingerprint);
 assert.equal(parameterGuidance('DELIVERY_REQUIRE_PHOTO',{DELIVERY_ATTENDANCE_MODE:'OPTIONAL'}),'');
 assert.ok(parameterGuidance('DELIVERY_REQUIRE_GPS',{DELIVERY_ATTENDANCE_MODE:'OPTIONAL'}));
});

test('supervision checklist distinguishes unanswered from false and preserves process questions',()=>{
 const questions=parseAuditItems([{key:'display',label:'Display rapi',required:true}]);
 assert.throws(()=>auditAnswers(questions,{}),/wajib/);
 assert.throws(()=>auditAnswers(questions,{display:null}),/wajib/);
 assert.deepEqual(auditAnswers(questions,{display:false,state:'FINISHED',other:true}),{display:false});
 for(const key of ['state','constructor','__proto__'])assert.throws(()=>parseAuditItems([{key,label:'Pertanyaan',required:false}]));
 assert.throws(()=>parseAuditItems([...questions,...questions]));
 assert.deepEqual(auditItems({SPV_AUDIT_ITEMS:JSON.stringify(questions)}),questions);
});

test('last active Admin is protected even for a custom role with Admin base',async()=>{
 let count=0,role='ADMIN',deletedAt=null;
 const db={$executeRaw:async()=>{},user:{findUnique:async()=>({id:'admin',role,deletedAt}),count:async()=>count}};
 await assert.rejects(()=>protectAdminRecovery(db,'admin','SALES'),e=>e.statusCode===409);
 await assert.rejects(()=>protectAdminRecovery(db,'admin',null),e=>e.statusCode===409);
 await protectAdminRecovery(db,'admin','ADMIN');count=1;
 await protectAdminRecovery(db,'admin','SALES');role='SALES';count=0;
 await protectAdminRecovery(db,'sales',null);deletedAt=new Date();
 await assert.rejects(()=>protectAdminRecovery(db,'sales',null),e=>e.statusCode===404);
});

test('legacy config endpoint never overwrites effective role/team settings with global rows',async t=>{
 const original=prisma.systemConfig.findMany;
 prisma.systemConfig.findMany=async()=>[{key:'SALES_ATTENDANCE_MODE',value:'IN_OUT'},{key:'LOGISTICS_METRICS',value:{distance:10}}];
 t.after(()=>{prisma.systemConfig.findMany=original;invalidateConfigCache();});
 await withPolicy({values:{...CONFIG_DEFAULTS,SALES_ATTENDANCE_MODE:'OPTIONAL'}},async()=>{
  const result=await getAllConfigs();assert.equal(result.SALES_ATTENDANCE_MODE,'OPTIONAL');assert.deepEqual(result.LOGISTICS_METRICS,{distance:10});
  assert.equal(await getConfigByKey('SALES_ATTENDANCE_MODE'),'OPTIONAL');
 });
});

test('three Sales attendance modes independently control real IN/OUT and continuing visits',()=>{
 for(const [mode,requireIn,requireOut,allowContinue] of [['IN_OUT',true,true,false],['IN_ONLY',true,false,true],['OPTIONAL',false,false,true]]){
  const policy=visitPolicy({...CONFIG_DEFAULTS,SALES_ATTENDANCE_MODE:mode});
  assert.equal(policy.requireIn,requireIn);assert.equal(policy.requireOut,requireOut);assert.equal(policy.allowContinue,allowContinue);
 }
 assert.equal(visitPolicy({SALES_ALLOW_CONTINUE_WITHOUT_OUT:true}).allowContinue,true);
 assert.equal(visitPolicy({ATTENDANCE_REQUIRE_PHOTO:false,SALES_IN_PHOTO:'REQUIRED',SALES_OUT_PHOTO:'OPTIONAL'}).photoIn,true);
 assert.equal(visitPolicy({ATTENDANCE_REQUIRE_PHOTO:true,SALES_IN_PHOTO:'OPTIONAL'}).photoIn,false);
});
test('pause/off block new API work while all completion and history paths remain available',()=>{
 for(const mode of ['OFF','PAUSED']){
  const values=Object.fromEntries(Object.keys(CONFIG_DEFAULTS).filter(k=>k.startsWith('FEATURE_')).map(k=>[k,mode]));
  for(const [path,method,body] of [['absensi/id/in','POST'],['orders','POST'],['pjp/planning/id/publish','POST'],['clusters/id','PATCH'],['teams/id','PATCH'],['delivery/routes','POST'],['customer-registrations','POST'],['customer-registrations/search-places','GET'],['vehicles/id','PUT'],['vehicles/id','DELETE'],['staff-attendance','POST',{action:'SHIFT_IN'}]])assert.equal(featureDecision(values,`/api/v1/${path}`,method,body).allowed,false,`${mode} ${path}`);
  for(const [path,method,body] of [['absensi/id/out','POST'],['orders/id/approve','PATCH'],['delivery/routes/id/actions','POST',{action:'CLOSE'}],['delivery/stops/id/return','POST'],['customer-registrations/id/register','POST'],['staff-attendance','POST',{action:'SHIFT_OUT'}],['orders','GET']])assert.equal(featureDecision(values,`/api/v1/${path}`,method,body).allowed,true,`${mode} ${path}`);
 }
});
test('all eight preparation combinations have a valid READY condition without invented checks',()=>{
 for(let mask=0;mask<8;mask++){
  const values=Object.fromEntries(['PICK','CHECK','LOAD'].map((stage,i)=>[`WAREHOUSE_REQUIRE_${stage}`,Boolean(mask&(1<<i))]));
  const stages=preparationStages(values),route={policySnapshot:{values},preparation:Object.fromEntries(stages.map(s=>[s,{actorId:'actual-person'}]))};
  assert.equal(preparationReady(route),true);
  if(stages.length){delete route.preparation[stages[0]];assert.equal(preparationReady(route),false);}
  assert.equal(stages.length,['PICK','CHECK','LOAD'].filter((_,i)=>mask&(1<<i)).length);
 }
});
test('dependency conflicts fail before publication and numeric/select boundaries are enforced',()=>{
 for(const patch of [{SALES_REQUIRE_GPS:false},{SPV_REQUIRE_GPS:false},{WAREHOUSE_REQUIRE_CHECK:false,WAREHOUSE_SEPARATE_CHECKER:true},{REGISTRATION_APPROVAL_MODE:'SEQUENTIAL',REGISTRATION_ACTIVATOR:'SUPERVISOR'},{SHIFT_ATTENDANCE_MODE:'OPTIONAL',ATTENDANCE_REQUIRE_ACTIVE_SHIFT:true}])assert.ok(policyConflicts({...CONFIG_DEFAULTS,...patch}).length);
 for(const param of CONFIG_PARAMS.filter(p=>p.type==='number')){assert.equal(parseConfigValue(param,param.min),param.min);assert.equal(parseConfigValue(param,param.max),param.max);assert.throws(()=>parseConfigValue(param,param.max+1));}
 for(const param of CONFIG_PARAMS.filter(p=>p.type==='select')){for(const option of param.options)assert.equal(parseConfigValue(param,option),option);assert.throws(()=>parseConfigValue(param,'INVALID_OPTION'));}
});
test('resolver applies company, role, team, scheduled versions and explicit inheritance correctly',async t=>{
 const original=prisma.systemConfig.findMany;
 const version=(values,effectiveAt='2026-01-01T00:00:00Z',revision=1)=>({values,effectiveAt,revision});
 const rows=[{key:'_POLICY_PROFILE:GLOBAL',value:{versions:[version({SALES_ATTENDANCE_MODE:'IN_ONLY',MAPS_API_KEY:'private'})]}},{key:'_POLICY_PROFILE:ROLE:SALES',value:{versions:[version({SALES_ATTENDANCE_MODE:'OPTIONAL'})]}},{key:'_POLICY_PROFILE:TEAM:spv',value:{versions:[version({SALES_ATTENDANCE_MODE:'IN_OUT'}),version({SALES_ATTENDANCE_MODE:'IN_ONLY'},'2027-01-01T00:00:00Z',2)]}}];
 prisma.systemConfig.findMany=async query=>query.where.key.startsWith?rows:[];invalidateConfigCache();
 t.after(()=>{prisma.systemConfig.findMany=original;invalidateConfigCache();});
 assert.equal((await effectivePolicy({role:'ADMIN'},Date.parse('2026-10-01'))).values.SALES_ATTENDANCE_MODE,'IN_ONLY');
 assert.equal((await effectivePolicy({role:'SALES'},Date.parse('2026-10-01'))).values.SALES_ATTENDANCE_MODE,'OPTIONAL');
 const actor={role:'SALES',supervisorId:'spv'};
 assert.equal((await effectivePolicy(actor,Date.parse('2026-10-01'))).sources.SALES_ATTENDANCE_MODE,'TEAM:spv');
 assert.equal((await effectivePolicy(actor,Date.parse('2027-02-01'))).values.SALES_ATTENDANCE_MODE,'IN_ONLY');
 assert.equal((await effectivePolicy(actor,Date.parse('2026-10-01'),{excludeScope:'TEAM:spv'})).values.SALES_ATTENDANCE_MODE,'OPTIONAL');
 assert.equal(Object.hasOwn(publicPolicy(await effectivePolicy(actor)).values,'MAPS_API_KEY'),false);
});
test('process snapshots preserve flow but feature/GPS stop switches remain live and contexts never mix',async()=>{
 const first={values:{...CONFIG_DEFAULTS,SALES_ATTENDANCE_MODE:'IN_ONLY',MAPS_API_KEY:'secret'},versions:[{revision:1}]};
 const snapshot=policySnapshot(first);assert.equal(snapshot.values.MAPS_API_KEY,undefined);assert.equal(snapshot.values.FEATURE_ORDERS_MODE,undefined);assert.equal(snapshot.values.DRIVER_TRACKING_MODE,undefined);
 await Promise.all(['OPTIONAL','IN_OUT'].map(mode=>withPolicy({values:{...CONFIG_DEFAULTS,SALES_ATTENDANCE_MODE:mode,DRIVER_TRACKING_MODE:'OFF'}},async()=>{
  await Promise.resolve();assert.equal(currentPolicy().values.SALES_ATTENDANCE_MODE,mode);
  withProcessPolicy({policySnapshot:snapshot},()=>{assert.equal(currentPolicy().values.SALES_ATTENDANCE_MODE,'IN_ONLY');assert.equal(currentPolicy().values.DRIVER_TRACKING_MODE,'OFF');});
  assert.equal(currentPolicy().values.SALES_ATTENDANCE_MODE,mode);
 })));
});
test('logical results and missing OUT are measured without fabricating attendance or manual sales',()=>{
 const stop={visitSession:{state:'FINISHED',result:{manualSalesMode:'REQUIRE_APPROVAL',isManualSalesApproved:true,orderAmount:100,skuSold:1}},attendances:[],orders:[]};
 assert.equal(visitState(stop),'COMPLETED');assert.equal(visitSalesResult(stop).orderAmount,100);assert.equal(visitSalesResult(stop).checkOut,undefined);
 stop.orders=[{status:'PENDING_APPROVAL',totalValue:100}];assert.equal(visitSalesResult(stop).orderAmount,0);
 stop.visitSession.state='INCOMPLETE';assert.equal(visitState(stop),'EXCEPTION');
});
test('GPS quality rejects inaccurate, stale, future and missing required metadata without inventing values',async()=>{
 const point={latitude:-6.9,longitude:107.6},read=async(key,fallback)=>({GPS_MAX_ACCURACY_METERS:50,GPS_MAX_AGE_SECONDS:120}[key]??fallback);
 assert.equal(await gpsEvidence({}),null);
 const unknown=await gpsEvidence(point,read);assert.equal(unknown.accuracy,null);assert.equal(unknown.observedAt,null);assert.equal(unknown.metadataKnown,false);
 for(const patch of [{accuracy:51},{accuracy:-1},{observedAt:new Date(Date.now()-121000).toISOString()},{observedAt:new Date(Date.now()+31000).toISOString()},{observedAt:'invalid'}])await assert.rejects(()=>gpsEvidence({...point,...patch},read),e=>e.statusCode===422);
 await assert.rejects(()=>gpsEvidence(point,async(key,fallback)=>key==='GPS_REQUIRE_METADATA'?true:read(key,fallback)),e=>e.statusCode===422);
 assert.equal((await gpsEvidence({...point,accuracy:12,observedAt:new Date().toISOString()},read)).metadataKnown,true);
});
test('approval UI and services agree on stages and automatic registration activation',()=>{
 const sequential={policySnapshot:{values:{ORDER_APPROVAL_MODE:'SEQUENTIAL'}},history:[]};
 assert.equal(orderReviewRole(sequential),'SUPERVISOR');assert.equal(reviewRoleAllowed(orderReviewRole(sequential),'ADMIN'),false);
 sequential.history.push({action:'SUPERVISOR_REVIEW'});assert.equal(orderReviewRole(sequential),'ADMIN');assert.equal(reviewRoleAllowed(orderReviewRole(sequential),'SUPERVISOR'),false);
 assert.equal(registrationActions({registrationStatus:'SUBMITTED'},'ADMIN',{REGISTRATION_APPROVAL_MODE:'NONE'}).activate,true);
 assert.equal(registrationActions({registrationStatus:'SUBMITTED'},'ADMIN',{REGISTRATION_APPROVAL_MODE:'NONE'}).review,false);
 assert.equal(registrationActions({registrationStatus:'SPV_APPROVED'},'SUPERVISOR',{REGISTRATION_APPROVAL_MODE:'SEQUENTIAL'}).activate,false);
 assert.equal(registrationActions({registrationStatus:'SPV_APPROVED'},'ADMIN',{REGISTRATION_APPROVAL_MODE:'SEQUENTIAL'}).activate,true);
 assert.equal(policyConflicts({...CONFIG_DEFAULTS,SALES_ATTENDANCE_MODE:'OPTIONAL',SALES_REQUIRE_GPS:false}).length,0);
});
test('PJP interval and explicit calendar holidays are enforced without shifting F2 recurrence',async()=>{
 const plan={startsOn:'2026-10-05',endsOn:'2026-10-20',rules:[{userId:'s',outletId:'o',anchorDate:'2026-10-05',intervalWeeks:2}]},sales=[{id:'s',name:'Sales',supervisorId:'spv'}],outlets=[{id:'o',name:'Outlet',cluster:{supervisorId:'spv'}}];
 const policy={workingDates:['2026-10-19'],PJP_HOLIDAY_POLICY:'SKIP'};
 const skipped=buildPlanCalendar(plan,sales,outlets,undefined,policy);assert.equal(skipped.summary.visits,1);assert.equal(skipped.days[0].date,'2026-10-19');assert.ok(skipped.warnings.some(i=>i.code==='HOLIDAY_VISIT'));
 assert.ok(buildPlanCalendar(plan,sales,outlets,undefined,{...policy,PJP_HOLIDAY_POLICY:'BLOCK'}).problems.some(i=>i.code==='HOLIDAY_VISIT'));
 assert.ok(buildPlanCalendar(plan,sales,outlets,undefined,{PJP_ALLOWED_INTERVALS:'1,4'}).problems.some(i=>i.code==='INTERVAL_DISABLED'));
 const db={systemConfig:{findMany:async()=>[]}};
 assert.deepEqual((await planningCalendar(db,plan.startsOn,plan.endsOn,{PJP_CALENDAR_SOURCE:'REPORT_CALENDAR'})).missing,['2026-10']);
 db.systemConfig.findMany=async()=>[{value:{month:'2026-10',revision:1,weekdays:[1],exceptions:[{date:'2026-10-05',working:false}]}}];
 const calendar=await planningCalendar(db,plan.startsOn,plan.endsOn,{PJP_CALENDAR_SOURCE:'REPORT_CALENDAR'});assert.equal(calendar.workingDates.includes('2026-10-05'),false);assert.equal(calendar.workingDates.includes('2026-10-19'),true);
});
