import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewActor} from '../src/modules/outlets/services/outlet-review-access.service.js';

test('outlet review grants never promote field Sales, warehouse or Driver into an office reviewer',async()=>{
 const permissions=Object.fromEntries(['can_validate_outlet','can_run_outlet_review','can_assign_outlet_review','can_apply_outlet_review','can_review_outlet_field','can_submit_outlet_field'].map(key=>[key,true]));
 for(const role of ['ADMIN','SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR'])for(const permission of Object.keys(permissions)){
  const db={user:{findMany:async()=>[{id:'actor',role,permissions}]},systemConfig:{findMany:async()=>[]}};
  const eligible=permission==='can_submit_outlet_field'?role==='SALES':['ADMIN','SUPERVISOR'].includes(role);
  if(eligible)assert.equal((await reviewActor(db,{id:'actor'},permission)).role,role);
  else await assert.rejects(()=>reviewActor(db,{id:'actor'},permission),e=>e.statusCode===403);
 }
});

test('outlet review reads fresh effective custom roles and rejects denied or deleted accounts',async()=>{
 const key='can_run_outlet_review';let actor={id:'actor',role:'SALES',roleCode:'CUSTOM_REVIEWER',permissions:{}};
 const db={user:{findMany:async()=>[actor]},systemConfig:{findMany:async()=>[{key:'ROLE_DEFINITIONS',value:[{code:'CUSTOM_REVIEWER',baseRole:'SUPERVISOR',defaultPermissions:{[key]:true}}]}]}};
 assert.equal((await reviewActor(db,{id:'actor',role:'SALES'},key)).role,'SUPERVISOR');
 actor={...actor,permissions:{[key]:false}};
 await assert.rejects(()=>reviewActor(db,{id:'actor'},key),e=>e.statusCode===403);
 actor={...actor,permissions:{[key]:true},deletedAt:new Date()};
 await assert.rejects(()=>reviewActor(db,{id:'actor'},key),e=>e.statusCode===403);
});
