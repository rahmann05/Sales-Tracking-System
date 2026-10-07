import { test } from 'node:test';
import assert from 'node:assert/strict';
import { offPjpSalesResult, visitSalesResult } from '../../shared/visit-metrics.mjs';
import { CONFIG_DEFINITIONS } from '../../shared/config.mjs';
import { getIsoWeekNumber, getCurrentWeekType } from '../src/modules/pjp/services/pjp.helpers.js';
import { approveRegistration } from '../src/modules/customer-registrations/services/approve-registration.service.js';
import { rejectRegistration } from '../src/modules/customer-registrations/services/reject-registration.service.js';
import { finalizeAndRegisterByAdmin } from '../src/modules/customer-registrations/services/finalize-and-register-by-admin.service.js';
import { checkIn } from '../src/modules/absensi/services/check-in.service.js';
import { prisma } from '../src/config/prisma.js';

function mockPrismaMethod(t, model, method, implementation) {
  const original = model[method];
  model[method] = implementation;
  t.after(() => { model[method] = original; });
}

test('B07: Only APPROVED orders enter nominal and SKU reports', () => {
  const stop = {
    attendances: [{ type: 'IN' }, { type: 'OUT', orderAmount: 500000, skuSold: 5 }],
    orders: [
      { id: '1', status: 'APPROVED', totalValue: 150000, items: [{ productId: 'p1' }, { productId: 'p2' }] },
      { id: '2', status: 'PENDING_APPROVAL', totalValue: 350000, items: [{ productId: 'p3' }] },
      { id: '3', status: 'REJECTED', totalValue: 800000, items: [{ productId: 'p4' }] },
    ],
  };

  const result = visitSalesResult(stop);
  assert.equal(result.orderAmount, 150000, 'Pending and rejected orders must not be counted');
  assert.equal(result.skuSold, 2, 'Only SKUs from approved orders must be counted');
  assert.equal(result.effective, true);
});

test('B07: Manual sales in NOTES_ONLY mode do not enter revenue/SKU', () => {
  const stop = {
    attendances: [{ type: 'IN' }, { type: 'OUT', orderAmount: 250000, skuSold: 3 }],
    orders: [],
  };

  const notesResult = visitSalesResult(stop, { manualSalesMode: 'NOTES_ONLY' });
  assert.equal(notesResult.orderAmount, 0);
  assert.equal(notesResult.skuSold, 0);

  const approvalPendingResult = visitSalesResult(stop, { manualSalesMode: 'REQUIRE_APPROVAL' });
  assert.equal(approvalPendingResult.orderAmount, 0);

  const approvedManualStop = {
    attendances: [{ type: 'IN' }, { type: 'OUT', orderAmount: 250000, skuSold: 3, isManualSalesApproved: true }],
    orders: [],
  };
  const approvalApprovedResult = visitSalesResult(approvedManualStop, { manualSalesMode: 'REQUIRE_APPROVAL' });
  assert.equal(approvalApprovedResult.orderAmount, 250000);
  assert.equal(approvalApprovedResult.skuSold, 3);
});

test('B08: Payment type enum matches backend and config (CASH, TOP, TRANSFER)', () => {
  const opGroup = CONFIG_DEFINITIONS.find(g => g.groupKey === 'OPERATIONS');
  const paymentParam = opGroup.params.find(p => p.key === 'DEFAULT_PAYMENT_TYPE');
  assert.deepEqual(paymentParam.options, ['CASH', 'TOP', 'TRANSFER']);
});

test('B02: ISO 8601 week number algorithm calculates properly', () => {
  // 2026-01-01 is a Thursday -> ISO Week 1
  const weekJan1 = getIsoWeekNumber(new Date('2026-01-01T00:00:00Z'));
  assert.equal(weekJan1, 1);
  assert.equal(getCurrentWeekType(new Date('2026-01-01T00:00:00Z')), 'WEEK_1');

  // 2026-01-08 is Thursday of week 2 -> ISO Week 2
  const weekJan8 = getIsoWeekNumber(new Date('2026-01-08T00:00:00Z'));
  assert.equal(weekJan8, 2);
  assert.equal(getCurrentWeekType(new Date('2026-01-08T00:00:00Z')), 'WEEK_2');
});

test('B01: NOO status guard prevents invalid status transitions', async t => {
  const supervisor = { id: 'spv-1', name: 'SPV Test', role: 'SUPERVISOR' };

  mockPrismaMethod(t, prisma.customerRegistration, 'findUnique', async () => ({
    id: 'reg-1',
    registrationStatus: 'SPV_APPROVED',
  }));

  // Re-approving already SPV_APPROVED registration must throw
  await assert.rejects(
    () => approveRegistration('reg-1', 'Note', supervisor),
    { statusCode: 400 }
  );

  mockPrismaMethod(t, prisma.customerRegistration, 'findUnique', async () => ({
    id: 'reg-2',
    registrationStatus: 'REGISTERED_ACTIVE',
  }));

  // Rejecting already active registration must throw
  await assert.rejects(
    () => rejectRegistration('reg-2', 'Reason', supervisor),
    { statusCode: 400 }
  );
});

test('B01: Finalize outlet requires SPV_APPROVED and valid GPS coordinates', async t => {
  const admin = { id: 'admin-1', name: 'Admin Test', role: 'ADMIN' };

  // Case 1: Status still SUBMITTED (not yet SPV_APPROVED)
  mockPrismaMethod(t, prisma.customerRegistration, 'findUnique', async () => ({
    id: 'reg-1',
    registrationStatus: 'SUBMITTED',
    customerCode: 'CUST-001',
    latitude: -6.9,
    longitude: 107.6,
  }));

  await assert.rejects(
    () => finalizeAndRegisterByAdmin('reg-1', {}, admin),
    { statusCode: 400 }
  );

  // Case 2: SPV_APPROVED but coordinates missing
  mockPrismaMethod(t, prisma.customerRegistration, 'findUnique', async () => ({
    id: 'reg-2',
    registrationStatus: 'SPV_APPROVED',
    customerCode: 'CUST-002',
    latitude: null,
    longitude: null,
  }));

  await assert.rejects(
    () => finalizeAndRegisterByAdmin('reg-2', {}, admin),
    { statusCode: 400 }
  );
});

test('B05: checkIn blocks attendance when outlet status is LOCKED', async t => {
  mockPrismaMethod(t,prisma,'$transaction',async fn=>fn(prisma));
  mockPrismaMethod(t,prisma,'$executeRaw',async()=>0);
  mockPrismaMethod(t, prisma.outletUnlockRequest, 'findFirst', async () => null);
  mockPrismaMethod(t, prisma.pjpStop, 'findUnique', async () => ({
    id: 'stop-locked',
    pjpId: 'pjp-1',
    sequence: 1,
    status: 'PENDING',
    pjp: { userId: 'sales-1', date: new Date() },
    outlet: { id: 'out-1', lockStatus: 'LOCKED', latitude: -6.9, longitude: 107.6 },
    attendances: [],
  }));

  await assert.rejects(
    () => checkIn('stop-locked', 'sales-1', -6.9, 107.6),
    { statusCode: 403 }
  );
});

test('manual approval is snapshot based and cannot bypass a recorded order', () => {
 const out = { type: 'OUT', orderAmount: 100, skuSold: 1, manualSalesMode: 'NOTES_ONLY', isManualSalesApproved: true };
 assert.equal(visitSalesResult({attendances:[out],orders:[]},{manualSalesMode:'REQUIRE_APPROVAL'}).orderAmount,0);
 const approved = {...out,manualSalesMode:'REQUIRE_APPROVAL'};
 assert.equal(visitSalesResult({attendances:[approved],orders:[]},{manualSalesMode:'NOTES_ONLY'}).orderAmount,100);
 assert.equal(visitSalesResult({attendances:[approved],orders:[{status:'PENDING_APPROVAL'}]}).orderAmount,0);
 assert.equal(visitSalesResult({attendances:[out],orders:[]},{manualSalesMode:'INCLUDE_ALL'}).orderAmount,0);
});
test('off PJP visit validation never approves manual revenue by itself', () => {
 const off={status:'APPROVED',orderAmount:100,skuSold:1,manualSalesMode:'REQUIRE_APPROVAL'};
 assert.equal(offPjpSalesResult(off).actual,true);
 assert.equal(offPjpSalesResult(off).orderAmount,0);
 assert.equal(offPjpSalesResult({...off,isManualSalesApproved:true}).orderAmount,100);
 assert.equal(offPjpSalesResult({...off,status:'REJECTED',isManualSalesApproved:true}).orderAmount,0);
});
