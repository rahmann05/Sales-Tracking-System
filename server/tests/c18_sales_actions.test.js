import test from 'node:test';
import assert from 'node:assert/strict';
import {salesVisitActions} from '../../shared/sales-visit-actions.mjs';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {pairwiseCases,assertPairwiseCoverage} from './helpers/pairwise.mjs';

test('Sales actions pairwise: role, feature mode, independent permissions, lock, state and frozen attendance',()=>{
 const dimensions={role:['ADMIN','SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR'],mode:['ACTIVE','PAUSED','OFF'],permission:[true,false],locked:[true,false],status:['PENDING','ARRIVED','ORDERED','VISITED'],attendance:['IN_OUT','IN_ONLY','OPTIONAL']};
 const rows=pairwiseCases(dimensions);assertPairwiseCoverage(assert,dimensions,rows);
 for(const c of rows){
  const settings={...CONFIG_DEFAULTS,FEATURE_SALES_VISITS_MODE:c.mode,FEATURE_ORDERS_MODE:c.mode,FEATURE_REROUTE_MODE:c.mode,FEATURE_UNLOCK_MODE:c.mode,SALES_ATTENDANCE_MODE:c.attendance,ORDER_REQUIRE_CHECKIN:true,ORDER_ALLOW_AFTER_VISIT:false};
  const user={role:c.role,permissions:{can_record_sales_visit:c.permission,can_create_order:c.permission,can_request_reroute:c.permission,can_request_attendance_exception:c.permission}};
  const result=salesVisitActions({settings,user,isLocked:c.locked,stop:{status:c.status}}),sales=c.role==='SALES',active=['ARRIVED','ORDERED'].includes(c.status),available=c.mode==='ACTIVE'&&c.permission;
  assert.equal(result.canStart,sales&&available&&!c.locked&&c.status==='PENDING',JSON.stringify(c));
  assert.equal(result.canComplete,sales&&active,JSON.stringify(c));
  assert.equal(result.lockedEntry,c.locked&&!active&&c.status!=='VISITED',JSON.stringify(c));
  assert.equal(result.canOrder,sales&&available&&c.status!=='ORDERED'&&(active||c.status==='PENDING'&&c.attendance==='OPTIONAL'),JSON.stringify(c));
  assert.equal(result.canRequestException,sales&&available,JSON.stringify(c));
  assert.equal(result.canReportClosed,sales&&available&&c.status!=='ORDERED',JSON.stringify(c));
 }
});

test('legacy process defaults and frozen attendance never inherit changed live process rules',()=>{
 const user={role:'SALES'},settings={...CONFIG_DEFAULTS,SALES_ATTENDANCE_MODE:'IN_OUT',ORDER_REQUIRE_CHECKIN:true,ORDER_ALLOW_AFTER_VISIT:true};
 const stop={status:'PENDING',policySnapshot:{values:{SALES_ATTENDANCE_MODE:'OPTIONAL'}}};
 const a=salesVisitActions({user,settings,stop});assert.equal(a.policy.mode,'OPTIONAL');assert.equal(a.frozen.ORDER_ALLOW_AFTER_VISIT,CONFIG_DEFAULTS.ORDER_ALLOW_AFTER_VISIT);assert.equal(a.canOrder,true);
 const active=salesVisitActions({user:{...user,permissions:{can_record_sales_visit:false}},settings:{...settings,FEATURE_SALES_VISITS_MODE:'OFF'},isLocked:true,stop:{...stop,status:'ARRIVED'}});
 assert.equal(active.lockedEntry,false);assert.equal(active.canStart,false);assert.equal(active.canComplete,true);
});
