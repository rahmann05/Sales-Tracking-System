import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../src/config/prisma.js';
import {
  sanitizeNikInput,
  sanitizeNpwpInput,
  sanitizePhoneInput,
  validateIndonesianPhone,
  validateIndonesianTaxNumber,
} from '../../shared/indonesia-identity.mjs';
import { DEFAULT_REGISTRATION_SUBMIT_REQUIRED_FIELDS } from '../../shared/registration-fields.mjs';
import { CONFIG_PARAMS } from '../../shared/config.mjs';
import { createRegistrationSchema } from '../src/modules/customer-registrations/customer-registrations.schema.js';
import { assertOutletLegal } from '../src/modules/outlets/services/outlet-data-policy.service.js';
import { getDivisions } from '../src/modules/divisions/services/get-divisions.service.js';

test('validateIndonesianTaxNumber validates 16-digit NIK and 15/16-digit or dotted NPWP', () => {
  assert.equal(validateIndonesianTaxNumber('NON_PKP', ''), null);
  assert.equal(validateIndonesianTaxNumber('NON_PKP', '3201012345678901'), null);
  assert.match(validateIndonesianTaxNumber('NON_PKP', 'hghghghghghhg'), /16 digit/);
  assert.match(validateIndonesianTaxNumber('NON_PKP', '320101234567890'), /16 digit/);
  assert.match(validateIndonesianTaxNumber('NON_PKP', '32010123456789012'), /16 digit/);

  assert.equal(validateIndonesianTaxNumber('PKP', '012345678901234'), null);
  assert.equal(validateIndonesianTaxNumber('PKP', '0123456789012345'), null);
  assert.equal(validateIndonesianTaxNumber('PKP', '01.234.567.8-901.000'), null);
  assert.match(validateIndonesianTaxNumber('PKP', 'hghghghg'), /NPWP/);
  assert.match(validateIndonesianTaxNumber('PKP', '1234567890'), /NPWP/);
});

test('validateIndonesianPhone validates Indonesian mobile and landline formats', () => {
  assert.equal(validateIndonesianPhone(''), null);
  assert.equal(validateIndonesianPhone('081234567890'), null);
  assert.equal(validateIndonesianPhone('+62 812-3456-7890'), null);
  assert.equal(validateIndonesianPhone('022-4201234'), null);
  assert.equal(validateIndonesianPhone('628123456789'), null);

  assert.match(validateIndonesianPhone('hjhjhjhjjhjhjhj'), /Indonesia/);
  assert.match(validateIndonesianPhone('0812'), /Indonesia/);
  assert.match(validateIndonesianPhone('1234567890'), /Indonesia/);
});

test('input sanitizers strip invalid characters and enforce max lengths', () => {
  assert.equal(sanitizeNikInput('abc3201-0123 4567890199'), '3201012345678901');
  assert.equal(sanitizeNpwpInput('ab01.234.567.8-901.000xyz'), '01.234.567.8-901.000');
  assert.equal(sanitizePhoneInput('+62abc812-3456-7890123'), '+62812-3456-7890');
  assert.equal(sanitizePhoneInput('0812ab345678'), '0812345678');
});

test('createRegistrationSchema and assertOutletLegal reject invalid NIK/NPWP and phone', () => {
  const validBase = { name: 'Toko Jaya', address: 'Jl. Cihampelas 10 Bandung' };
  assert.equal(
    createRegistrationSchema.safeParse({
      body: { ...validBase, phone: 'hjhjhjhjjhjhjhj' },
    }).success,
    false
  );
  assert.equal(
    createRegistrationSchema.safeParse({
      body: { ...validBase, taxType: 'NON_PKP', taxNumber: 'hghghghghghhg' },
    }).success,
    false
  );
  assert.equal(
    createRegistrationSchema.safeParse({
      body: {
        ...validBase,
        phone: '081234567890',
        taxType: 'NON_PKP',
        taxNumber: '3201012345678901',
      },
    }).success,
    true
  );

  assert.throws(() => assertOutletLegal({ phone: 'invalid-phone' }), { statusCode: 400 });
  assert.throws(
    () => assertOutletLegal({ taxType: 'PKP', taxNumber: 'not-npwp' }),
    { statusCode: 400 }
  );
});

test('getDivisions excludes legacy MIX / DIVISI MIX rows', async (t) => {
  const origFindMany = prisma.division.findMany;
  let capturedArgs = null;
  prisma.division.findMany = async (args) => {
    capturedArgs = args;
    return [{ id: 'div-belfoods', code: 'BELFOODS', name: 'BELFOODS', isActive: true }];
  };
  t.after(() => {
    prisma.division.findMany = origFindMany;
  });

  const rows = await getDivisions();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, 'BELFOODS');
  assert.equal(Array.isArray(capturedArgs.where.NOT), true);
  assert.equal(capturedArgs.where.NOT.length, 2);
});

test('REGISTRATION_SUBMIT_REQUIRED_FIELDS defaults to required NOO identity, tax, territory, and visit fields', () => {
  const param = CONFIG_PARAMS.find((p) => p.key === 'REGISTRATION_SUBMIT_REQUIRED_FIELDS');
  assert.ok(param);
  assert.equal(param.defaultValue, DEFAULT_REGISTRATION_SUBMIT_REQUIRED_FIELDS);
  assert.ok(param.defaultValue.includes('phone'));
  assert.ok(param.defaultValue.includes('taxNumber'));
});
