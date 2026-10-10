import {test} from 'node:test';
import assert from 'node:assert/strict';
import {processPolicyValues} from '../../shared/process-policy.mjs';
import {withPolicy,currentPolicy} from '../src/modules/config/services/policy-context.service.js';
import {withProcessPolicy,processValue} from '../src/modules/config/services/process-policy.service.js';
test('new result/checklist obligations do not silently alter legacy instances, but live stop switches still apply',async()=>{
 const snapshot={values:{SALES_ATTENDANCE_MODE:'IN_ONLY',FEATURE_ORDERS_MODE:'ACTIVE',DRIVER_TRACKING_MODE:'ALWAYS'}};
 const live={SALES_ATTENDANCE_MODE:'IN_OUT',VISIT_RESULT_OFFER_MODE:'REQUIRED',TRIP_DEPARTURE_CHECKLIST:[{key:'new',label:'Pertanyaan baru',required:true}],FEATURE_ORDERS_MODE:'OFF',DRIVER_TRACKING_MODE:'OFF'};
 const result=processPolicyValues(snapshot,live);assert.equal(result.VISIT_RESULT_OFFER_MODE,'OPTIONAL');assert.deepEqual(result.TRIP_DEPARTURE_CHECKLIST,[]);assert.equal(result.FEATURE_ORDERS_MODE,'OFF');assert.equal(result.DRIVER_TRACKING_MODE,'OFF');
 assert.equal(processPolicyValues(null,live),live);
 await withPolicy({values:live},async()=>{
  withProcessPolicy({policySnapshot:snapshot},()=>assert.deepEqual(currentPolicy().values,result));
  assert.equal(await processValue({policySnapshot:snapshot},'VISIT_RESULT_OFFER_MODE'),'OPTIONAL');
  assert.equal(await processValue({policySnapshot:snapshot},'FEATURE_ORDERS_MODE'),'OFF');
  assert.equal(currentPolicy().values.VISIT_RESULT_OFFER_MODE,'REQUIRED');
 });
});
