import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../src/config/prisma.js';
import { getRegistrations } from '../src/modules/customer-registrations/services/get-registrations.service.js';

test('getRegistrations filters division safely via AND clauses and excludes Base64 blobs by default', async (t) => {
  const origFindMany = prisma.customerRegistration.findMany;
  const origCount = prisma.customerRegistration.count;
  const origGroupBy = prisma.customerRegistration.groupBy;
  const calls = [];

  prisma.customerRegistration.findMany = async (args) => {
    calls.push(args);
    if (calls.length === 1) {
      return [
        { id: 'reg-1', name: 'Toko A', divisionName: 'BELFOODS', registrationStatus: 'SUBMITTED' },
        { id: 'reg-2', name: 'Toko B', divisionName: 'UNICHARM', registrationStatus: 'SUBMITTED' },
      ];
    }
    return [{ id: 'reg-1' }];
  };
  prisma.customerRegistration.count = async () => 2;
  prisma.customerRegistration.groupBy = async () => [
    { registrationStatus: 'SUBMITTED', _count: { _all: 2 } },
  ];

  t.after(() => {
    prisma.customerRegistration.findMany = origFindMany;
    prisma.customerRegistration.count = origCount;
    prisma.customerRegistration.groupBy = origGroupBy;
  });

  const result = await getRegistrations(
    { division: 'BELFOODS', search: 'Toko' },
    { id: 'admin-1', role: 'ADMIN' }
  );

  const listQuery = calls[0];
  assert.equal(Object.hasOwn(listQuery.where, 'division'), false);
  assert.equal(Array.isArray(listQuery.where.AND), true);
  assert.equal(listQuery.where.AND.length, 2);
  assert.equal(Object.hasOwn(listQuery.select, 'photoUrl'), false);
  assert.equal(Object.hasOwn(listQuery.select, 'taxDocumentUrl'), false);

  assert.equal(result.data.length, 2);
  assert.equal(result.data[0].hasPhoto, true);
  assert.equal(result.data[0].division, 'BELFOODS');
  assert.equal(result.data[1].hasPhoto, false);
});

test('getRegistrations supports includeMedia=true without select projection exclusion', async (t) => {
  const origFindMany = prisma.customerRegistration.findMany;
  const origCount = prisma.customerRegistration.count;
  const origGroupBy = prisma.customerRegistration.groupBy;
  let capturedArgs = null;

  prisma.customerRegistration.findMany = async (args) => {
    capturedArgs = args;
    return [
      {
        id: 'reg-3',
        divisionName: 'BELFOODS',
        photoUrl: 'data:image/jpeg;base64,abc',
        registrationStatus: 'SUBMITTED',
      },
    ];
  };
  prisma.customerRegistration.count = async () => 1;
  prisma.customerRegistration.groupBy = async () => [
    { registrationStatus: 'SUBMITTED', _count: { _all: 1 } },
  ];

  t.after(() => {
    prisma.customerRegistration.findMany = origFindMany;
    prisma.customerRegistration.count = origCount;
    prisma.customerRegistration.groupBy = origGroupBy;
  });

  const result = await getRegistrations({ includeMedia: 'true' }, { id: 'admin-1', role: 'ADMIN' });
  assert.equal(Object.hasOwn(capturedArgs, 'select'), false);
  assert.equal(result.data[0].hasPhoto, true);
  assert.equal(result.data[0].division, 'BELFOODS');
});
