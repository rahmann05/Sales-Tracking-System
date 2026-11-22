// Aggregate-only, read-only inspection. No production records are copied.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import pg from 'pg';
assert.ok(process.argv.includes('--read-only'), 'Explicit --read-only required');
const env = dotenv.parse(fs.readFileSync(new URL('../.env.production', import.meta.url)));
const url = new URL(env.DIRECT_URL || env.DATABASE_URL);
assert.ok(url.hostname.endsWith('.neon.tech'));
url.searchParams.set('sslmode', 'verify-full');
const db = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 15000 });
const queries = {
  missingVehiclePhotos: `SELECT count(*) FROM "Vehicle" WHERE "deletedAt" IS NULL AND ("photoUrl" IS NULL OR "photoUrl"='')`,
  serviceEvidenceNeedsReview: `SELECT count(*) FROM "VehicleServiceRecord" WHERE evidence->>'reviewRequired'='true'`,
  placeholderAuditEntries: `SELECT count(*) FROM "AuditEvent" WHERE action='REMOVE_MIGRATION_PLACEHOLDER'`,
  openCasesWithDeletedOwner: `SELECT count(*) FROM "DeliveryIssue" d JOIN "User" u ON u.id=d."ownerId" WHERE d.status::text NOT IN ('DONE','CANCELLED') AND u."deletedAt" IS NOT NULL`,
  outletPointEqualsClusterCenter: `SELECT count(*) FROM "Outlet" o JOIN "Cluster" c ON c.id=o."clusterId" WHERE o."deletedAt" IS NULL AND o.latitude=c."centerLat" AND o.longitude=c."centerLng"`,
  outletPointEqualsHistoricFallback: `SELECT count(*) FROM "Outlet" WHERE "deletedAt" IS NULL AND latitude=-6.885229 AND longitude=107.489662`,
  outletsMissingPoint: `SELECT count(*) FROM "Outlet" WHERE "deletedAt" IS NULL AND (latitude IS NULL OR longitude IS NULL)`,
  openCasesWithoutTeamOrOwner: `SELECT count(*) FROM "DeliveryIssue" WHERE status::text NOT IN ('DONE','CANCELLED') AND "ownerId" IS NULL AND "responsibleRole" IS NULL`,
};
try {
  await db.connect();
  await db.query('BEGIN READ ONLY');
  await db.query("SET LOCAL statement_timeout='15s'");
  const counts = {};
  for (const [key, sql] of Object.entries(queries))
    counts[key] = Number((await db.query(sql)).rows[0].count);
  await db.query('ROLLBACK');
  const report = {
    at: new Date().toISOString(),
    scope:
      'Aggregate metadata only; no production row copy; coordinate equality is a review signal, not proof of an incorrect location',
    counts,
    needsIndependentEvidence: true,
  };
  fs.writeFileSync(
    new URL('../../docs/ST_PRODUCTION_AGGREGATE_AUDIT_20261013.json', import.meta.url),
    JSON.stringify(report, null, 2)
  );
  console.log(JSON.stringify(report));
} finally {
  await db.query('ROLLBACK').catch(() => {});
  await db.end();
}
