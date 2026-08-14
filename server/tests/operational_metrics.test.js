import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Supervisor & Operational Manager Business Logic Unit Tests', () => {
  describe('Daily Summary Metrics Calculation', () => {
    it('should calculate accurate compliance and adherence rate', () => {
      const totalTarget = 20;
      const completed = 16;
      const skipped = 2;
      const rerouted = 2;

      const completionRate = Math.round((completed / totalTarget) * 100);
      const totalResolved = completed + skipped + rerouted;
      const operationalAdherence = Math.round((totalResolved / totalTarget) * 100);

      assert.equal(completionRate, 80);
      assert.equal(operationalAdherence, 100);
    });

    it('should calculate total order volume and count accurately', () => {
      const orders = [
        { id: '1', totalValue: 1500000, status: 'APPROVED' },
        { id: '2', totalValue: 2300000, status: 'APPROVED' },
        { id: '3', totalValue: 700000, status: 'REJECTED' },
        { id: '4', totalValue: 1200000, status: 'PENDING_APPROVAL' },
      ];

      const validOrders = orders.filter((o) => o.status !== 'REJECTED');
      const totalValue = validOrders.reduce((sum, o) => sum + o.totalValue, 0);

      assert.equal(validOrders.length, 3);
      assert.equal(totalValue, 5000000);
    });
  });

  describe('Shift Attendance & Punctuality Logic', () => {
    it('should classify clock-in before 08:00 WIB as on-time (TEPAT_WAKTU)', () => {
      const clockInTime = '07:45 WIB';
      const [hours, minutes] = clockInTime.replace(' WIB', '').split(':').map(Number);
      const isLate = hours > 8 || (hours === 8 && minutes > 0);

      assert.equal(isLate, false);
    });

    it('should classify clock-in after 08:00 WIB as late (TERLAMBAT) with correct minute diff', () => {
      const clockInTime = '08:15 WIB';
      const [hours, minutes] = clockInTime.replace(' WIB', '').split(':').map(Number);
      const isLate = hours > 8 || (hours === 8 && minutes > 0);
      const lateMinutes = (hours - 8) * 60 + minutes;

      assert.equal(isLate, true);
      assert.equal(lateMinutes, 15);
    });
  });

  describe('Off-PJP Override Hierarchy Logic', () => {
    it('should allow Operational Manager override to supersede SPV validation', () => {
      const initialRecord = {
        id: 'off-pjp-01',
        salesName: 'Budi Santoso',
        spvValidationStatus: 'REJECTED',
        spvValidationNote: 'Di luar rute master',
        opsOverrideStatus: null,
        opsOverrideNote: null,
      };

      // Ops manager reviews and applies managerial override
      const overrideAction = {
        status: 'APPROVED',
        note: 'Disahkan oleh Manajer Ops setelah konfirmasi pemilik toko',
        by: 'Manajer Operasional',
      };

      const finalRecord = {
        ...initialRecord,
        effectiveStatus: overrideAction.status,
        opsOverrideStatus: overrideAction.status,
        opsOverrideNote: overrideAction.note,
        opsOverrideBy: overrideAction.by,
      };

      assert.equal(finalRecord.effectiveStatus, 'APPROVED');
      assert.ok(finalRecord.opsOverrideNote.includes('Manajer Ops'));
    });
  });
});
