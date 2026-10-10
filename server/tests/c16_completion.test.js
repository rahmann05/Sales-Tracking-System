import test from 'node:test';
import assert from 'node:assert/strict';
import {revisitSchedule} from '../../shared/revisit-policy.mjs';
import {automaticFollowUp} from '../../shared/automatic-follow-up.mjs';
import {parseAuditItems} from '../../shared/supervision-checklist.mjs';
import {defaultVisitCatalog,visitCatalog,visitReferenceLabels} from '../../shared/visit-reference-catalog.mjs';
import {retainServiceCodes} from '../../shared/reference-catalog.mjs';
import {registrationFieldError,registrationSupplement,MASTER_OUTLET_FIELDS} from '../../shared/registration-fields.mjs';
import {mapMasterImport} from '../../shared/master-import.mjs';
import {CONFIG_DEFAULTS,CONFIG_PARAMS,parseConfigValue} from '../../shared/config.mjs';
import {attentionCategory,workspaceChoice} from '../../shared/workspace-presentation.mjs';
import {followUpReviewers} from '../../shared/follow-up-policy.mjs';
import {visitResultPolicyError,visitOutcomeText} from '../../shared/visit-outcome.mjs';
const now=Date.parse('2026-10-11T02:00:00Z');
test('Revisit uses valid WIB date/time, future horizon and explicit enable switch',()=>{
 assert.equal(revisitSchedule({date:'2026-10-12',time:'08:00'}, {},now).effectiveAt,'2026-10-12T01:00:00.000Z');
 for(const raw of [{date:'2026-02-30'},{date:'2026-10-11',time:'08:00'},{date:'2026-10-12',time:'24:00'},{date:'2027-01-01'}])assert.throws(()=>revisitSchedule(raw,{},now));
 assert.throws(()=>revisitSchedule({date:'2026-10-12'},{CLOSED_OUTLET_ALLOW_REVISIT:false},now));
 assert.equal(Object.hasOwn(revisitSchedule({date:'2026-10-12'},{},now),'manualCode'),false);
});
test('Automatic followup groups only configured failed questions and does not overwrite existing tasks',()=>{
 const items=parseAuditItems([{key:'display',label:'Pajangan sesuai',required:false,autoFollowUp:true},{key:'score',label:'Nilai audit',type:'NUMBER',min:0,max:10,failureBelow:5,required:false}]);
 const record={id:'visit',checkInAt:new Date(now-60000).toISOString()},values={...CONFIG_DEFAULTS,FOLLOW_UP_AUTO_ENABLED:true};
 assert.equal(automaticFollowUp(record,items,{display:true,score:0},values,now),null);
 const task=automaticFollowUp(record,items,{display:false,score:0},values,now);assert.equal(task.source.items.length,1);assert.equal(task.dueDate,'2026-10-12');
 assert.equal(automaticFollowUp(record,items,{display:false},{...values,FOLLOW_UP_AUTO_ENABLED:false},now),null);
 for(const status of ['OPEN','SUBMITTED','DONE'])assert.equal(automaticFollowUp({...record,followUp:{status}},items,{display:false},values,now),null);
 assert.equal(automaticFollowUp(record,items,{display:false,score:0},{...values,FOLLOW_UP_AUTO_TRIGGER:'ANY_FAILURE'},now).source.items.length,2);
});
test('SLA trigger is independent of checklist failure and uses actual elapsed minutes',()=>{
 const record={id:'visit',checkInAt:new Date(now-120*60000).toISOString()},values={...CONFIG_DEFAULTS,FOLLOW_UP_AUTO_ENABLED:true,FOLLOW_UP_AUTO_TRIGGER:'SLA'};
 assert.equal(automaticFollowUp(record,[],{},values,now-1),null);
 assert.equal(automaticFollowUp(record,[],{},values,now).source.items[0].value,120);
 assert.throws(()=>parseAuditItems([{key:'memo',label:'Catatan',required:false,type:'TEXT',autoFollowUp:true}]));
});
test('Reference catalogs retain business semantics and codes, while labels and activation are configurable',()=>{
 const key='VISIT_PURPOSE_CATALOG',old=defaultVisitCatalog(key),changed=old.map(r=>({...r,label:'Baru '+r.label}));
 assert.equal(visitReferenceLabels({purpose:'ORDER'},{[key]:changed}).purpose,'Baru Penawaran / order');
 assert.throws(()=>visitCatalog(key,{[key]:[...old,{code:'CUSTOM',label:'Custom',active:true}]}));
 assert.throws(()=>visitReferenceLabels({purpose:'ORDER'},{[key]:old.map(r=>({...r,active:r.code!=='ORDER'}))}));
 assert.throws(()=>retainServiceCodes({[key]:old.slice(1)},{[key]:old}));
 const obstacles=[...defaultVisitCatalog('VISIT_OBSTACLE_CATALOG'),{code:'CUSTOM',label:'Temuan khusus',active:true}];
 assert.equal(visitReferenceLabels({purpose:'ORDER',obstacleCode:'CUSTOM'},{VISIT_OBSTACLE_CATALOG:obstacles}).obstacleCode,'Temuan khusus');
 assert.match(visitOutcomeText({purpose:'ORDER',referenceLabels:{purpose:'Label saat dicatat'}}),/Label saat dicatat/);
 assert.match(visitResultPolicyError({purpose:'ORDER',obstacleCode:'OTHER'},{VISIT_RESULT_OBSTACLE_MODE:'DISABLED'}),/dinonaktifkan/);
});
test('Outlet requirements distinguish activation/master fields and accept only real weekday codes',()=>{
 assert.equal(registrationFieldError({city:'Bandung',visitDays:['SENIN']},'city,visitDays'),null);
 assert.match(registrationFieldError({city:' ',visitDays:[]},'city,visitDays'),/Kota.*Hari/);
 assert.equal(registrationSupplement({visitDays:' SENIN, RABU ',city:' Bandung '}).visitDays,'SENIN,RABU');
 for(const days of ['SENIN,SENIN','MONDAY',''])assert.throws(()=>registrationSupplement({visitDays:days}));
 assert.throws(()=>registrationFieldError({},'city','master',MASTER_OUTLET_FIELDS));
 assert.match(registrationFieldError({},'itineraryCode','master',MASTER_OUTLET_FIELDS),/F1/);
});
test('Mapped master imports preserve exact identity, zero, optional blanks and reject column reuse',()=>{
 const rows=mapMasterImport('products',['id','Nama','Harga','Isi'],[['SKU-01','Nugget','25000','12']],{sku:'id',name:'Nama',price:'Harga',unitsPerUnit:'Isi'},'UPDATE_ONLY');
 assert.deepEqual(rows,[{action:'UPDATE_ONLY',data:{sku:'SKU-01',name:'Nugget',price:25000,unitsPerUnit:12}}]);
 assert.throws(()=>mapMasterImport('products',['A'],[['X']],{sku:'A',name:'A'}));
 assert.throws(()=>mapMasterImport('products',['Harga'],[['Rp 25.000']],{price:'Harga'}));
 assert.equal(mapMasterImport('products',['Harga'],[['0']],{price:'Harga'})[0].data.price,0);
});
test('All new controls validate defaults; master cannot require registration-only fields',()=>{
 for(const key of ['CLOSED_OUTLET_ALLOW_REVISIT','OFF_PJP_OUTLET_SCOPE','FOLLOW_UP_AUTO_ENABLED','FOLLOW_UP_REVIEWER_MODE','VISIT_PURPOSE_CATALOG','MASTER_OUTLET_REQUIRED_FIELDS','ATTENTION_WIDGETS','WORKSPACE_PAGE_SIZE','MAP_DEFAULT_SHOW_OUTLETS']){const p=CONFIG_PARAMS.find(p=>p.key===key);assert.ok(p,key);assert.deepEqual(parseConfigValue(p,p.defaultValue),p.defaultValue);}
 assert.throws(()=>parseConfigValue(CONFIG_PARAMS.find(p=>p.key==='MASTER_OUTLET_REQUIRED_FIELDS'),'city'));
 assert.equal(workspaceChoice('ORDER_REVIEW_DEFAULT_STATUS','INVALID'),'PENDING');
 assert.equal(attentionCategory('PACKING','SUPERVISOR'),'ALL');assert.equal(attentionCategory('PACKING','ADMIN'),'PACKING');
});
test('Task reviewer modes retain team boundaries, grants and self-review protection',()=>{
 const owner={id:'sales',role:'SALES',supervisorId:'spv'},people=[owner,{id:'spv',role:'SUPERVISOR'},{id:'foreign',role:'SUPERVISOR'},{id:'admin',role:'ADMIN'},{id:'denied',role:'ADMIN',permissions:{can_review_follow_up:false}}];
 assert.deepEqual(followUpReviewers(owner,people,'ADMIN').map(p=>p.id),['admin']);
 assert.deepEqual(followUpReviewers(owner,people,'SUPERVISOR').map(p=>p.id),['spv']);
});
