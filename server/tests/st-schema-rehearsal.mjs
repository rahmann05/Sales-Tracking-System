// Run only against the explicitly approved empty Neon schema-only branch.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import pg from 'pg';
const root = new URL('../../', import.meta.url);
const branch = JSON.parse(fs.readFileSync(new URL('.backups/st-neon-branch.json', root)));
assert.equal(branch.branch.init_source, 'parent-schema');
const env = dotenv.parse(
  fs.readFileSync(new URL('.env.production', new URL('../', import.meta.url)))
);
const url = new URL(env.DIRECT_URL || env.DATABASE_URL);
const host = branch.endpoints[0].host;
assert.notEqual(url.hostname, host);
assert.ok(host.endsWith('.neon.tech') && !host.includes('-pooler'));
url.hostname = host;
url.searchParams.set('sslmode', 'verify-full');
const db = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 15000 });
const names = [
  '20261011123000_operational_work_queues',
  '20261011143000_location_issue_queue_recovery',
  '20261011160000_multi_destination_packing_load',
  '20261011170000_vehicle_capacity_provenance',
];
try {
  await db.connect();
  await db.query('BEGIN');
  // No production data may be present in this workflow.
  for (const table of ['User', 'Outlet', 'DeliveryIssue', 'PackingList', 'DeliveryRoute'])
    assert.equal(
      Number((await db.query(`SELECT count(*) FROM "${table}"`)).rows[0].count),
      0,
      `${table} must be empty`
    );
  // The schema-only snapshot may already include newer DDL. Reconstruct the
  // prior schema inside this rollback-only transaction, after proving it empty.
  for (const [table, columns] of Object.entries({
    PackingList: [
      'requestId',
      'requestHash',
      'loadPlanVersion',
      'destinations',
      'suggestedVehicleId',
      'suggestedVehicleSnapshot',
    ],
    DeliveryRoute: ['requestId', 'requestHash'],
    DeliveryIssue: ['requestId', 'requestHash', 'responsibleRole', 'supervisorId', 'salesVisitId'],
    Invoice: ['destinationId', 'sourceOrderIds'],
    DeliveryStop: ['packingDestinationId'],
    Vehicle: ['capacityProfile'],
  }))
    for (const column of columns)
      await db.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}"`);
  await db.query(
    'ALTER TABLE "DeliveryIssue" ALTER COLUMN "ownerId" SET NOT NULL, ALTER COLUMN "dueAt" SET NOT NULL'
  );
  await db.query(
    `INSERT INTO "User" (id,name,email,password,role,"roleCode","updatedAt") VALUES ('st-admin','Synthetic Admin','st-admin@example.invalid','not-a-login','ADMIN','ADMIN',now()),('st-warehouse','Synthetic Warehouse','st-wh@example.invalid','not-a-login','KEPALA_GUDANG','KEPALA_GUDANG',now())`
  );
  for (const [id, status, action, owner] of [
    ['location-open', 'OPEN', 'LOCATION_DISCREPANCY', 'st-warehouse'],
    ['location-done', 'DONE', 'LOCATION_DISCREPANCY', 'st-warehouse'],
    ['admin-location', 'OPEN', 'LOCATION_DISCREPANCY', 'st-admin'],
    ['goods', 'OPEN', 'REPORT', 'st-warehouse'],
  ])
    await db.query(
      `INSERT INTO "DeliveryIssue" (id,title,reason,"ownerId","dueAt",status,"createdById",history) VALUES ($1,$1,'Synthetic migration fixture',$2,now(),$3,'st-admin',$4::jsonb)`,
      [
        id,
        owner,
        status,
        JSON.stringify([{ action, note: 'Original synthetic evidence retained' }]),
      ]
    );
  for (const name of names)
    await db.query(
      fs.readFileSync(
        new URL(`prisma/migrations/${name}/migration.sql`, new URL('../', import.meta.url)),
        'utf8'
      )
    );
  const rows = (
    await db.query('SELECT id,"ownerId","responsibleRole",history FROM "DeliveryIssue" ORDER BY id')
  ).rows;
  const open = rows.find((r) => r.id === 'location-open');
  assert.equal(open.ownerId, null);
  assert.equal(open.responsibleRole, 'ADMIN');
  assert.equal(open.history[0].note, 'Original synthetic evidence retained');
  assert.equal(open.history[1].action, 'QUEUE_RECOVERY');
  assert.equal(open.history[1].before.ownerId, 'st-warehouse');
  assert.equal(rows.find((r) => r.id === 'location-done').ownerId, 'st-warehouse');
  assert.equal(rows.find((r) => r.id === 'location-done').history.length, 1);
  assert.equal(rows.find((r) => r.id === 'admin-location').ownerId, 'st-admin');
  assert.equal(rows.find((r) => r.id === 'goods').responsibleRole, 'KEPALA_GUDANG');
  assert.equal(rows.length, 4);
  const pixel =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  await db.query(
    `INSERT INTO "Vehicle" (id,code,name,"maxCartons","maxWeightKg","fuelKmPerLiter","fuelType","fuelPricePerLiter","photoUrl","updatedAt") VALUES ('st-placeholder','st-placeholder','Synthetic',10,100,10,'DIESEL',10000,$1,now()),('st-real','st-real','Synthetic real',10,100,10,'DIESEL',10000,'https://example.invalid/real.jpg',now())`,
    [pixel]
  );
  await db.query(
    `INSERT INTO "VehicleServiceRecord" (id,"vehicleId","serviceDate","workshopName","serviceType",cost,"odometerAtService","receiptPhotoUrl","workshopLatitude","workshopLongitude",evidence,"updatedAt") VALUES ('st-service','st-placeholder',now(),'Synthetic','OIL',0,100,$1,-6,107,'{"original":true}'::jsonb,now())`,
    [pixel]
  );
  await db.query(
    `INSERT INTO "SystemConfig" (key,value,"updatedAt") VALUES ('ROLE_DEFINITIONS','[{"code":"SUPIR","defaultPermissions":{"can_record_vehicle_maintenance":false}},{"code":"SALES","defaultPermissions":{}}]'::jsonb,now())`
  );
  const repairs = [
    '20261013040000_driver_service_permission',
    '20261013040100_remove_placeholder_photo_evidence',
  ];
  for (const name of repairs)
    await db.query(
      fs.readFileSync(
        new URL(`prisma/migrations/${name}/migration.sql`, new URL('../', import.meta.url)),
        'utf8'
      )
    );
  assert.equal(
    (await db.query(`SELECT "photoUrl" FROM "Vehicle" WHERE id='st-placeholder'`)).rows[0].photoUrl,
    null
  );
  assert.equal(
    (await db.query(`SELECT "photoUrl" FROM "Vehicle" WHERE id='st-real'`)).rows[0].photoUrl,
    'https://example.invalid/real.jpg'
  );
  const service = (await db.query(`SELECT * FROM "VehicleServiceRecord" WHERE id='st-service'`))
    .rows[0];
  assert.equal(service.receiptPhotoUrl, null);
  assert.equal(service.evidence.original, true);
  assert.equal(service.evidence.reviewRequired, true);
  assert.equal(service.workshopLatitude, -6);
  assert.equal(
    Number(
      (
        await db.query(
          `SELECT count(*) FROM "AuditEvent" WHERE "entityId" IN ('st-placeholder','st-service')`
        )
      ).rows[0].count
    ),
    2
  );
  for (const name of repairs)
    await db.query(
      fs.readFileSync(
        new URL(`prisma/migrations/${name}/migration.sql`, new URL('../', import.meta.url)),
        'utf8'
      )
    );
  assert.equal(
    Number(
      (
        await db.query(
          `SELECT count(*) FROM "AuditEvent" WHERE "entityId" IN ('st-placeholder','st-service')`
        )
      ).rows[0].count
    ),
    2,
    'repair is idempotent'
  );
  const roles = (await db.query(`SELECT value FROM "SystemConfig" WHERE key='ROLE_DEFINITIONS'`))
    .rows[0].value;
  assert.equal(roles[0].defaultPermissions.can_record_vehicle_maintenance, true);
  assert.deepEqual(roles[1], { code: 'SALES', defaultPermissions: {} });
  const report = {
    at: new Date().toISOString(),
    passed: true,
    branchId: branch.branch.id,
    source:
      'schema-only; prior schema reconstructed in rollback-only transaction with synthetic fixtures; no production records copied',
    migrations: names,
    checks: [
      'empty business tables',
      'four migrations applied',
      'prior evidence retained',
      'open location queue recovered with history',
      'completed cases unchanged',
      'authorized Admin retained',
      'goods queue retained',
    ],
    productionModified: false,
  };
  report.migrations.push(...repairs);
  report.checks.push(
    'exact placeholder removed with audit',
    'real photo preserved',
    'coordinates preserved for review',
    'repair idempotent',
    'driver permission moved to forward migration; other roles unchanged'
  );
  // Rollback DDL and fixtures, so repeated rehearsal is safe.
  await db.query('ROLLBACK');
  fs.writeFileSync(
    new URL('docs/ST_SCHEMA_REHEARSAL_20261013.json', root),
    JSON.stringify(report, null, 2)
  );
  console.log(JSON.stringify(report));
} finally {
  await db.query('ROLLBACK').catch(() => {});
  await db.end();
}
