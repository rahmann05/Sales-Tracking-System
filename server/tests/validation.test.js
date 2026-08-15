import { describe, it, before } from 'node:test';
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

describe('Outlet Validation Anti-False-Positive Heuristics Unit Tests', () => {
  // Dynamic import of validation service functions
  let service;
  before(async () => {
    service = await import('../src/modules/outlets/outlet-validation.service.js');
  });

  describe('Name Normalization & Typo Tolerance', () => {
    it('should strip common Indonesian store prefixes cleanly', () => {
      assert.equal(service.normalizeIndonesianStoreName('Toko Azka'), 'azka');
      assert.equal(service.normalizeIndonesianStoreName('Tk. Sumber Berkah'), 'sumber berkah');
      assert.equal(service.normalizeIndonesianStoreName('Warung Bu Siti'), 'bu siti'); // only strips warung first
      assert.equal(service.normalizeIndonesianStoreName('CV. Jaya Abadi'), 'jaya abadi');
    });

    it('should match phonetic variations (Aska vs Toko Azka)', () => {
      const sim = service.calculateNameSimilarity('Aska', 'Toko Azka');
      assert.ok(sim >= 0.9, `Expected >= 0.9, got ${sim}`);
    });

    it('should match identical names with prefixes', () => {
      const sim = service.calculateNameSimilarity('66 Nam Nam', 'Toko 66 Nam Nam');
      assert.ok(sim >= 0.95, `Expected >= 0.95, got ${sim}`);
    });
  });

  describe('Address Keyword & Locality Similarity', () => {
    it('should recognize key kampung and street names despite abbreviations', () => {
      const dbAddr = 'Kp nyenyerean no.157 b RT';
      const googleAddr = 'Kp.nyenyerean Jl. Sadarmanah No.141, RT.002/RW.018, Leuwigajah, Kec. Cimahi Sel., Kota Cimahi';
      const sim = service.calculateAddressSimilarity(dbAddr, googleAddr);
      assert.ok(sim >= 0.5, `Expected >= 0.5 for matching kampung token, got ${sim}`);
    });

    it('should score zero for addresses with no token overlap', () => {
      const addr1 = 'Jl Raya Cikole No 10 Lembang';
      const addr2 = 'Jl Pluit Mas Raya No 3 Pejagalan Jakarta Utara';
      const sim = service.calculateAddressSimilarity(addr1, addr2);
      assert.equal(sim, 0);
    });
  });

  describe('Admin Areas Extraction', () => {
    it('should extract city, subdistrict, and province correctly', () => {
      const components = [
        { long_name: 'Leuwigajah', types: ['administrative_area_level_3', 'locality'] },
        { long_name: 'Kota Cimahi', types: ['administrative_area_level_2'] },
        { long_name: 'Jawa Barat', types: ['administrative_area_level_1'] },
        { long_name: '40532', types: ['postal_code'] },
      ];
      const res = service.extractAdminAreas(components, 'Cimahi, Jawa Barat');
      assert.equal(res.cityOrRegency, 'Kota Cimahi');
      assert.equal(res.subdistrict, 'Leuwigajah');
      assert.equal(res.province, 'Jawa Barat');
    });
  });

  describe('Find Place Distance Clamping & Locality Guard', () => {
    it('should discard Find Place candidate located >5km away (e.g. Jakarta vs Bandung)', () => {
      const outlet = {
        name: 'Aska',
        latitude: -6.899296,
        longitude: 107.525335,
      };
      // Place candidate in Jakarta (122km away)
      const distantResult = {
        success: true,
        placeName: 'Aska Indoco, Pt',
        lat: -6.134035,
        lng: 106.709143,
        formattedAddress: 'Jl. Pluit Mas Raya, Jakarta Utara',
      };

      const scored = service.scoreFindPlace(distantResult, outlet);
      assert.equal(scored.score, 0, 'Distant candidate should receive 0 score');
      assert.equal(scored.isFarMismatch, true);
      assert.ok(scored.details.note.includes('Diabaikan'));
    });

    it('should score local Find Place candidate nearby highly', () => {
      const outlet = {
        name: 'Toko Azka',
        latitude: -6.899296,
        longitude: 107.525335,
      };
      // Place candidate within 50m
      const localResult = {
        success: true,
        placeName: 'Toko Azka',
        lat: -6.899280,
        lng: 107.525320,
        formattedAddress: 'Jl. Sadarmanah, Cimahi',
      };

      const scored = service.scoreFindPlace(localResult, outlet);
      assert.ok(scored.score >= 90, `Expected score >= 90 for close match, got ${scored.score}`);
    });

    it('should match hyphenated store names (Al-Fath 2 vs Toko Al - Fath 2)', () => {
      const sim = service.calculateNameSimilarity('Al-Fath 2', 'Toko Al - Fath 2');
      assert.ok(sim >= 0.9, `Expected similarity >= 0.9, got ${sim}`);
    });

    it('should match Indonesian number digit to word (3 Mart vs TIGAMART)', () => {
      const sim1 = service.calculateNameSimilarity('3 Mart', 'TIGAMART');
      assert.ok(sim1 >= 0.95, `Expected similarity >= 0.95, got ${sim1}`);
      const sim2 = service.calculateNameSimilarity('3 Mart', 'Tiga Mart');
      assert.ok(sim2 >= 0.95, `Expected similarity >= 0.95, got ${sim2}`);
    });
  });
});

