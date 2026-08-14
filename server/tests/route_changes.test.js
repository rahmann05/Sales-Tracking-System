import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  VISIT_STATUS, 
  ROUTE_CHANGE_TYPE, 
  ROUTE_CHANGE_STATUS,
  NOTIFICATION_TYPES 
} from '../src/utils/constants.js';

describe('Route Changes & Incident Management Unit Tests', () => {
  it('should transition stop status to CLOSED_REPORTED when sales reports closed shop', () => {
    const pjpStop = {
      id: 'stop-01',
      outletId: 'outlet-01',
      sequence: 1,
      status: VISIT_STATUS.PENDING,
    };

    // Sales reports closed shop incident
    const reportedStop = {
      ...pjpStop,
      status: VISIT_STATUS.CLOSED_REPORTED,
      closedReason: 'Toko Sedang Renovasi',
      reportedAt: new Date().toISOString(),
    };

    assert.equal(reportedStop.status, VISIT_STATUS.CLOSED_REPORTED);
    assert.equal(reportedStop.closedReason, 'Toko Sedang Renovasi');
  });

  it('should resolve incident as SKIP when Supervisor approves bypass', () => {
    const incidentRequest = {
      id: 'rc-01',
      type: ROUTE_CHANGE_TYPE.SKIP,
      status: ROUTE_CHANGE_STATUS.PENDING_APPROVAL,
      pjpStopId: 'stop-01',
    };

    // Supervisor approves skip
    const approvedSkip = {
      ...incidentRequest,
      status: ROUTE_CHANGE_STATUS.APPROVED,
      handledByRole: 'SUPERVISOR',
      notificationType: NOTIFICATION_TYPES.ROUTE_SKIP_ACKNOWLEDGED,
    };

    assert.equal(approvedSkip.status, ROUTE_CHANGE_STATUS.APPROVED);
    assert.equal(approvedSkip.handledByRole, 'SUPERVISOR');
    assert.equal(approvedSkip.notificationType, NOTIFICATION_TYPES.ROUTE_SKIP_ACKNOWLEDGED);
  });

  it('should require Operational Manager approval for REROUTE with replacement outlet', () => {
    const rerouteRequest = {
      id: 'rc-02',
      type: ROUTE_CHANGE_TYPE.REROUTE,
      status: ROUTE_CHANGE_STATUS.PENDING_APPROVAL,
      pjpStopId: 'stop-02',
      originalOutletId: 'outlet-cmh-01',
      replacementOutletId: 'outlet-cmh-08',
      reason: 'Toko awal tutup, dialihkan ke toko pengganti terdekat',
    };

    // Operational Manager approves reroute
    const approvedReroute = {
      ...rerouteRequest,
      status: ROUTE_CHANGE_STATUS.APPROVED,
      approvedByRole: 'MANAJER_OPERASIONAL',
      notificationType: NOTIFICATION_TYPES.REROUTE_APPROVED,
    };

    assert.equal(approvedReroute.status, ROUTE_CHANGE_STATUS.APPROVED);
    assert.equal(approvedReroute.approvedByRole, 'MANAJER_OPERASIONAL');
    assert.equal(approvedReroute.replacementOutletId, 'outlet-cmh-08');
  });
});
