import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveNotificationTarget,
  resolveNotificationTab,
} from '../../client/src/utils/notificationTab.js';
import { TAB_IDS } from '../../client/src/constants/tabIds.js';

test('DELIVERY_FOLLOW_UP maps to issue detail inside AttentionPanel for Admin, Supervisor, and Kepala Gudang', () => {
  const notif = {
    type: 'DELIVERY_FOLLOW_UP',
    title: 'Informasi penanganan diperbarui',
    message: 'Barang rusak fixture',
    payload: { issueId: 'iss-1', routeId: 'rt-1' },
  };

  assert.deepEqual(resolveNotificationTarget(notif, 'ADMIN'), {
    tab: TAB_IDS.ADMIN_ATTENTION,
    params: {
      attentionFilter: 'ALL',
      attentionCategory: 'ISSUE',
      attentionSearch: '',
      attentionPage: 1,
      attentionItem: 'issue:iss-1',
    },
  });
  assert.deepEqual(resolveNotificationTarget(notif, 'SUPERVISOR'), {
    tab: TAB_IDS.SPV_ATTENTION,
    params: {
      attentionFilter: 'ALL',
      attentionCategory: 'ISSUE',
      attentionSearch: '',
      attentionPage: 1,
      attentionItem: 'issue:iss-1',
    },
  });
  assert.deepEqual(resolveNotificationTarget(notif, 'KEPALA_GUDANG'), {
    tab: TAB_IDS.WAREHOUSE_ATTENTION,
    params: {
      attentionFilter: 'ALL',
      attentionCategory: 'ISSUE',
      attentionSearch: '',
      attentionPage: 1,
      attentionItem: 'issue:iss-1',
    },
  });
  assert.deepEqual(resolveNotificationTarget(notif, 'SUPIR'), {
    tab: TAB_IDS.DRIVER_TRIPS,
    params: { driverTrip: 'rt-1', driverStop: '' },
  });
  assert.deepEqual(
    resolveNotificationTarget({ ...notif, payload: { orderId: 'ord-9' } }, 'SALES'),
    {
      tab: TAB_IDS.SALES_ORDERS,
      params: { salesOrderStatus: 'ALL', salesOrder: 'ord-9' },
    }
  );
  assert.deepEqual(resolveNotificationTarget(notif, 'SALES'), {
    tab: TAB_IDS.SALES_FOLLOW_UP,
    params: {},
  });

  const resolved = {
    type: 'DELIVERY_FOLLOW_UP',
    title: 'Masalah telah diselesaikan',
    payload: { issueId: 'iss-1' },
  };
  assert.deepEqual(resolveNotificationTarget(resolved, 'ADMIN'), {
    tab: TAB_IDS.ADMIN_ATTENTION,
    params: {
      attentionFilter: 'HISTORY',
      attentionCategory: 'ISSUE',
      attentionSearch: '',
      attentionPage: 1,
      attentionItem: 'history:issue:iss-1',
    },
  });
});

test('SLA_ESCALATION deep links directly to the escalated attentionKey', () => {
  const notif = {
    type: 'SLA_ESCALATION',
    title: 'Pekerjaan melewati batas eskalasi',
    payload: { attentionKey: 'order:ord-42', category: 'ORDER' },
  };
  assert.deepEqual(resolveNotificationTarget(notif, 'ADMIN'), {
    tab: TAB_IDS.ADMIN_ATTENTION,
    params: {
      attentionFilter: 'ALL',
      attentionCategory: 'ORDER',
      attentionSearch: '',
      attentionPage: 1,
      attentionItem: 'order:ord-42',
    },
  });
});

test('Order notifications deep link to role approval/order workspace with orderId', () => {
  const created = { type: 'ORDER_CREATED', payload: { orderId: 'ord-1' } };
  const approved = { type: 'ORDER_APPROVED', payload: { orderId: 'ord-2' } };

  assert.deepEqual(resolveNotificationTarget(created, 'ADMIN'), {
    tab: TAB_IDS.ADMIN_APPROVAL,
    params: { orderSection: 'orders', orderStatus: 'ALL', orderDetail: 'ord-1' },
  });
  assert.deepEqual(resolveNotificationTarget(created, 'SUPERVISOR'), {
    tab: TAB_IDS.SPV_APPROVAL,
    params: { spvApproval: 'orders', orderStatus: 'ALL', orderDetail: 'ord-1' },
  });
  assert.deepEqual(resolveNotificationTarget(approved, 'SALES'), {
    tab: TAB_IDS.SALES_ORDERS,
    params: { salesOrderStatus: 'ALL', salesOrder: 'ord-2' },
  });
  assert.deepEqual(resolveNotificationTarget(approved, 'KEPALA_GUDANG'), {
    tab: TAB_IDS.DELIVERY_PACKING_LIST,
    params: { packingOrder: 'ord-2' },
  });
});

test('Unlock, Route Change, Off-PJP, and Exception notifications route accurately per role', () => {
  const unlock = { type: 'UNLOCK_REQUEST', payload: { unlockRequestId: 'u-1' } };
  assert.deepEqual(resolveNotificationTarget(unlock, 'ADMIN'), {
    tab: TAB_IDS.ADMIN_APPROVAL,
    params: { orderSection: 'unlock' },
  });
  assert.deepEqual(resolveNotificationTarget(unlock, 'SUPERVISOR'), {
    tab: TAB_IDS.SPV_APPROVAL,
    params: { spvApproval: 'unlock', spvQueue: 'pending', spvRequest: 'UNLOCK_REQUEST:u-1' },
  });
  assert.equal(resolveNotificationTab(unlock, 'SALES'), TAB_IDS.SALES_VISITS);

  const routeChange = { type: 'ROUTE_CHANGE_REPORTED', payload: { routeChangeRequestId: 'rc-5' } };
  assert.deepEqual(resolveNotificationTarget(routeChange, 'SUPERVISOR'), {
    tab: TAB_IDS.SPV_APPROVAL,
    params: { spvApproval: 'closed', spvQueue: 'pending', spvRequest: 'CLOSED_SHOP:rc-5' },
  });
  assert.equal(resolveNotificationTab(routeChange, 'ADMIN'), TAB_IDS.ADMIN_ATTENTION);

  const offPjp = { type: 'OFF_PJP_SUBMITTED', payload: { offPjpAttendanceId: 'off-7' } };
  assert.deepEqual(resolveNotificationTarget(offPjp, 'SUPERVISOR'), {
    tab: TAB_IDS.SPV_APPROVAL,
    params: { spvApproval: 'offpjp', spvQueue: 'pending', spvRequest: 'attendance:off-7' },
  });

  const exc = { type: 'EXCEPTION_CORRECTION_REQUESTED', payload: { exceptionId: 'ex-9' } };
  assert.deepEqual(resolveNotificationTarget(exc, 'SUPERVISOR'), {
    tab: TAB_IDS.SPV_ATTENTION,
    params: {
      attentionFilter: 'ALL',
      attentionCategory: 'EXCEPTION',
      attentionSearch: '',
      attentionPage: 1,
      attentionItem: 'operational:ex-9',
    },
  });
  assert.equal(resolveNotificationTab(exc, 'SALES'), TAB_IDS.SALES_FOLLOW_UP);
});

test('Outlet Registration, Explicit payload.tab Field Task, Vehicle Service, and Delivery routes work', () => {
  const noo = {
    type: 'OUTLET_REGISTRATION_SUBMITTED',
    payload: { registrationId: 'reg-3', status: 'SUBMITTED' },
  };
  assert.deepEqual(resolveNotificationTarget(noo, 'ADMIN'), {
    tab: TAB_IDS.OUTLET_APPROVAL,
    params: { outletApprovalStatus: 'SUBMITTED', outletApprovalId: 'reg-3' },
  });
  assert.deepEqual(resolveNotificationTarget(noo, 'SALES'), {
    tab: TAB_IDS.OUTLET_REGISTRATION,
    params: { registrationView: 'HISTORY' },
  });

  const fieldAssigned = {
    type: 'OUTLET_FIELD_ASSIGNED',
    payload: { tab: 'sales-follow-up', outletFieldTask: 'ft-11' },
  };
  assert.deepEqual(resolveNotificationTarget(fieldAssigned, 'SALES'), {
    tab: TAB_IDS.SALES_FOLLOW_UP,
    params: { outletFieldTask: 'ft-11' },
  });

  const svc = { type: 'VEHICLE_SERVICE_DUE', payload: { vehicleId: 'veh-2' } };
  assert.deepEqual(resolveNotificationTarget(svc, 'KEPALA_GUDANG'), {
    tab: TAB_IDS.WAREHOUSE_VEHICLES,
    params: { warehouseVehicle: 'veh-2' },
  });
  assert.deepEqual(resolveNotificationTarget(svc, 'ADMIN'), {
    tab: TAB_IDS.ADMIN_VEHICLES,
    params: { warehouseVehicle: 'veh-2' },
  });

  for (const type of ['DELIVERY_PREPARATION', 'DELIVERY_RETURN_ASSIGNED']) {
    assert.deepEqual(resolveNotificationTarget({ type, payload: { routeId: 'r-8', stopId: 's-2' } }, 'SUPIR'), {
      tab: TAB_IDS.DRIVER_TRIPS,
      params: { driverTrip: 'r-8', driverStop: 's-2' },
    });
    assert.deepEqual(
      resolveNotificationTarget({ type, payload: { routeId: 'r-8', stopId: 's-2' } }, 'ADMIN'),
      {
        tab: TAB_IDS.DELIVERY_MONITOR,
        params: { deliveryRoute: 'r-8', deliveryStop: 's-2' },
      }
    );
  }
});

test('Generic payload fallback and unknown notification fallback resolve cleanly without dead clicks', () => {
  assert.deepEqual(resolveNotificationTarget({ payload: { issueId: 'iss-fallback' } }, 'ADMIN'), {
    tab: TAB_IDS.ADMIN_ATTENTION,
    params: {
      attentionFilter: 'ALL',
      attentionCategory: 'ISSUE',
      attentionSearch: '',
      attentionPage: 1,
      attentionItem: 'issue:iss-fallback',
    },
  });

  assert.deepEqual(resolveNotificationTarget({ title: 'Pemberitahuan umum' }, 'ADMIN'), {
    tab: TAB_IDS.ADMIN_ATTENTION,
    params: {},
  });
  assert.equal(resolveNotificationTab({ title: 'Pemberitahuan umum' }, 'SALES'), TAB_IDS.SALES_FOLLOW_UP);
});
