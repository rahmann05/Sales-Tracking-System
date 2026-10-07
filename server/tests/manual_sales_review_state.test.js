import test from 'node:test';
import assert from 'node:assert/strict';
import {applyManualSalesDecision} from '../../client/src/shared/components/common/manualSalesReviewState.js';

test('manual sales decision removes a pending card immediately and updates its count', () => {
  const state={total:2,data:[{id:'first',manualSalesStatus:'PENDING'},{id:'second',manualSalesStatus:'PENDING'}]};
  const next=applyManualSalesDecision(state,'first','APPROVED','PENDING');
  assert.equal(next.total,1);
  assert.deepEqual(next.data,[{id:'second',manualSalesStatus:'PENDING'}]);
  assert.deepEqual(state.data.map(item=>item.id),['first','second'],'Current screen state must remain immutable');
});

test('manual sales decision keeps records visible in a historical filter', () => {
  const state={total:1,data:[{id:'first',manualSalesStatus:'PENDING'}]};
  const next=applyManualSalesDecision(state,'first','REJECTED','APPROVED');
  assert.equal(next.total,1);
  assert.equal(next.data[0].manualSalesStatus,'REJECTED');
  assert.equal(next.data[0].isManualSalesApproved,false);
});
