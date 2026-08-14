import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createOffPjpAttendanceSchema, validateOffPjpSchema } from '../src/modules/absensi/off-pjp.schema.js';
import { createOutletSchema } from '../src/modules/outlets/outlets.schema.js';

describe('Zod Request Validation Schemas Unit Tests', () => {
  describe('Off-PJP Attendance Schema', () => {
    it('should pass validation for valid Off-PJP submission payload', () => {
      const validPayload = {
        body: {
          outletName: 'Toko Sumber Rezeki Baru',
          customerName: 'Hj. Aminah',
          phone: '081234567890',
          address: 'Jl. Raya Cimahi No. 120, Cimahi',
          reason: 'Kunjungan toko prospek baru untuk ekspansi',
          latitude: -6.8722,
          longitude: 107.5423,
        },
      };

      const result = createOffPjpAttendanceSchema.safeParse(validPayload);
      assert.equal(result.success, true);
    });

    it('should fail validation when outletName or address is missing/too short', () => {
      const invalidPayload = {
        body: {
          outletName: 'A', // too short
          address: 'Jl', // too short
          reason: 'Pros', // too short
          latitude: -6.8722,
          longitude: 107.5423,
        },
      };

      const result = createOffPjpAttendanceSchema.safeParse(invalidPayload);
      assert.equal(result.success, false);
      assert.ok(result.error.issues.length >= 3);
    });

    it('should validate Off-PJP validation / override action payload', () => {
      const validValidatePayload = {
        params: {
          id: '123e4567-e89b-12d3-a456-426614174000',
        },
        body: {
          approved: true,
        },
      };

      const result = validateOffPjpSchema.safeParse(validValidatePayload);
      assert.equal(result.success, true);
    });
  });

  describe('Master Outlet Schema', () => {
    it('should pass validation for valid outlet creation payload', () => {
      const validOutlet = {
        body: {
          name: 'Borma Toserba Padalarang',
          address: 'Jl. Raya Padalarang No. 500, KBB',
          latitude: -6.8375,
          longitude: 107.4764,
          clusterId: '123e4567-e89b-12d3-a456-426614174000',
          creditLimit: 15000000,
        },
      };

      const result = createOutletSchema.safeParse(validOutlet);
      assert.equal(result.success, true);
    });

    it('should reject invalid coordinates (out of latitude/longitude bounds)', () => {
      const invalidCoords = {
        body: {
          name: 'Outlet Invalid Coords',
          address: 'Jl. Contoh No. 1',
          latitude: 105.0, // max is 90
          longitude: 200.0, // max is 180
          clusterId: '123e4567-e89b-12d3-a456-426614174000',
        },
      };

      const result = createOutletSchema.safeParse(invalidCoords);
      assert.equal(result.success, false);
    });
  });
});
