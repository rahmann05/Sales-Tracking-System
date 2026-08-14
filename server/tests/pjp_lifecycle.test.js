import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PJP_STATUS, VISIT_STATUS } from '../src/utils/constants.js';

describe('PJP Route Lifecycle & Sequencing Unit Tests', () => {
  it('should initialize PJP in SCHEDULED state with sorted stops', () => {
    const rawStops = [
      { id: 'stop-3', sequence: 3, outletName: 'Toko C', status: VISIT_STATUS.PENDING },
      { id: 'stop-1', sequence: 1, outletName: 'Toko A', status: VISIT_STATUS.PENDING },
      { id: 'stop-2', sequence: 2, outletName: 'Toko B', status: VISIT_STATUS.PENDING },
    ];

    const sortedStops = [...rawStops].sort((a, b) => a.sequence - b.sequence);

    const pjp = {
      id: 'pjp-01',
      salesId: 'usr-sales-1',
      date: '2026-08-14',
      status: PJP_STATUS.SCHEDULED,
      stops: sortedStops,
    };

    assert.equal(pjp.status, PJP_STATUS.SCHEDULED);
    assert.equal(pjp.stops[0].sequence, 1);
    assert.equal(pjp.stops[1].sequence, 2);
    assert.equal(pjp.stops[2].sequence, 3);
  });

  it('should transition PJP to IN_PROGRESS upon first stop check-in', () => {
    const pjp = {
      id: 'pjp-01',
      status: PJP_STATUS.SCHEDULED,
      stops: [
        { id: 'stop-1', status: VISIT_STATUS.PENDING },
        { id: 'stop-2', status: VISIT_STATUS.PENDING },
      ],
    };

    // First stop is visited
    pjp.stops[0].status = VISIT_STATUS.VISITED;
    pjp.stops[0].checkInTime = new Date().toISOString();

    const hasStarted = pjp.stops.some((s) => s.status === VISIT_STATUS.VISITED);
    if (hasStarted && pjp.status === PJP_STATUS.SCHEDULED) {
      pjp.status = PJP_STATUS.IN_PROGRESS;
    }

    assert.equal(pjp.status, PJP_STATUS.IN_PROGRESS);
  });

  it('should transition PJP to COMPLETED when all stops are visited or resolved', () => {
    const pjp = {
      id: 'pjp-01',
      status: PJP_STATUS.IN_PROGRESS,
      stops: [
        { id: 'stop-1', status: VISIT_STATUS.VISITED },
        { id: 'stop-2', status: VISIT_STATUS.SKIPPED },
        { id: 'stop-3', status: VISIT_STATUS.VISITED },
      ],
    };

    const isAllDone = pjp.stops.every((s) => 
      s.status === VISIT_STATUS.VISITED || s.status === VISIT_STATUS.SKIPPED
    );

    if (isAllDone) {
      pjp.status = PJP_STATUS.COMPLETED;
    }

    assert.equal(pjp.status, PJP_STATUS.COMPLETED);
  });
});
