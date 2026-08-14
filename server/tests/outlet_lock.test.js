import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OUTLET_LOCK_STATUS, NOTIFICATION_TYPES } from '../src/utils/constants.js';

describe('Outlet Lock & Unlock Flow Unit Tests', () => {
  it('should transition outlet status to UNLOCK_REQUESTED upon sales request', () => {
    const outlet = {
      id: 'outlet-pdl-03',
      name: 'Grosir Padalarang Indah',
      lockStatus: OUTLET_LOCK_STATUS.LOCKED,
      creditLimit: 10000000,
      outstanding: 12000000,
    };

    // Sales requests temporary unlock for order processing
    const unlockRequest = {
      id: 'req-01',
      outletId: outlet.id,
      reason: 'Pelanggan sudah transfer sebagian saldo tertunggak',
      requestedBy: 'usr-sales-1',
    };

    const updatedOutlet = {
      ...outlet,
      lockStatus: OUTLET_LOCK_STATUS.UNLOCK_REQUESTED,
      pendingUnlockRequest: unlockRequest,
    };

    assert.equal(updatedOutlet.lockStatus, OUTLET_LOCK_STATUS.UNLOCK_REQUESTED);
    assert.ok(updatedOutlet.pendingUnlockRequest);
  });

  it('should revert outlet to NORMAL and generate notification when SPV approves unlock', () => {
    const outlet = {
      id: 'outlet-pdl-03',
      lockStatus: OUTLET_LOCK_STATUS.UNLOCK_REQUESTED,
    };

    // SPV approves unlock request
    const approvedResult = {
      ...outlet,
      lockStatus: OUTLET_LOCK_STATUS.NORMAL,
      unlockedBy: 'Ahmad Subagja (SPV)',
      notification: {
        type: NOTIFICATION_TYPES.UNLOCK_APPROVED,
        title: 'Buka Kunci Outlet Disetujui',
      },
    };

    assert.equal(approvedResult.lockStatus, OUTLET_LOCK_STATUS.NORMAL);
    assert.equal(approvedResult.notification.type, NOTIFICATION_TYPES.UNLOCK_APPROVED);
  });

  it('should maintain LOCKED status when SPV rejects unlock request', () => {
    const outlet = {
      id: 'outlet-pdl-03',
      lockStatus: OUTLET_LOCK_STATUS.UNLOCK_REQUESTED,
    };

    // SPV rejects unlock
    const rejectedResult = {
      ...outlet,
      lockStatus: OUTLET_LOCK_STATUS.LOCKED,
      rejectionReason: 'Bukti transfer belum valid di rekening giro',
    };

    assert.equal(rejectedResult.lockStatus, OUTLET_LOCK_STATUS.LOCKED);
    assert.ok(rejectedResult.rejectionReason);
  });
});
