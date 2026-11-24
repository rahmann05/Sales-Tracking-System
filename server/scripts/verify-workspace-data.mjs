import 'dotenv/config';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { countsAsPlannedVisit, wibDateKey, wibDayRange } from '../../shared/visit-metrics.mjs';
import app from '../src/app.js';
import { config } from '../src/config/index.js';
import { prisma } from '../src/config/prisma.js';
import { assertDemoDatabase } from '../prisma/seeds/context.js';

assertDemoDatabase();
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api/v1`;

const get = async (path, user, expected = 200) => {
  const token = user ? jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: '2m' }) : null;
  const response = await fetch(base + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(8000),
  });
  const body = await response.json();
  assert.equal(response.status, expected, `${path}: ${body.message || ''}`);
  return body.data;
};

try {
  const users = await prisma.user.findMany({ where: { deletedAt: null } });
  const admin = users.find((u) => u.email === 'admin@sinaranugrah.com');
  const member = users.find((u) => u.email === 'cahya.sld514@sinaranugrah.com');
  const supervisors = users.filter((u) => u.role === 'SUPERVISOR');
  assert.ok(admin && member && supervisors.length === 2, 'Seed accounts must exist');

  for (const user of users) {
    const response = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: process.env.SEED_PASSWORD || 'DemoSinar2026!',
      }),
      signal: AbortSignal.timeout(8000),
    });
    const body = await response.json();
    assert.equal(response.status, 200, `Login ${user.email}`);
    assert.equal(body.data.user.role, user.role);
    assert.ok(body.data.accessToken);
  }

  const warehouse = users.find((u) => u.role === 'KEPALA_GUDANG');
  const documents = await get('/delivery/packing-lists', warehouse);
  assert.ok(documents.items.length >= 6, 'Warehouse must see released packing lists');

  await get('/teams', null, 401);
  await get('/teams', member, 403);
  const all = await get('/teams', admin);
  assert.equal(all.sales.length, 5);

  const date = (await prisma.systemConfig.findUnique({ where: { key: 'BELFOODS_UAT_SEED' } })).value
    .date;

  for (const supervisor of supervisors) {
    const team = await get('/teams', supervisor);
    assert.ok(team.sales.some((s) => s.supervisorId === supervisor.id));
    assert.ok(
      team.sales.every((s) => s.supervisorId === supervisor.id || s.supervisorId === null),
      'Team data must remain scoped'
    );

    const templates = await get('/pjp/templates', supervisor);
    assert.ok(
      templates.sales.every((s) => s.pjpTemplates.some((t) => t.stops.length > 0)),
      'Weekly templates must be populated'
    );
    assert.ok(templates.sales.every((s) => s.supervisorId === supervisor.id));

    const report = await get(`/daily-calls?date=${date}`, supervisor);
    assert.ok(report.rows.length > 0, 'Daily Call should contain seeded visits');
    const ids = new Set(team.sales.filter((s) => s.supervisorId === supervisor.id).map((s) => s.id));
    assert.ok(
      report.rows.every((row) => ids.has(row.salesmanId)),
      'Daily Call must not leak another team'
    );

    const expectedApprovedToday = await prisma.order.aggregate({
      where: {
        createdBy: { in: [...ids] },
        status: 'APPROVED',
        pjpStop: { pjp: { date: wibDayRange(date) } },
      },
      _sum: { totalValue: true },
    });
    assert.equal(
      report.summary.totalOrderAmount,
      expectedApprovedToday._sum.totalValue || 0,
      'Daily Call order sum must match APPROVED orders'
    );
    console.log(
      `${supervisor.name}: ${team.sales.length} sales, ${templates.sales.reduce((n, s) => n + s.pjpTemplates.length, 0)} templates, ${report.rows.length} Daily Call rows.`
    );
  }

  const report = await get(`/daily-calls?date=${date}&userId=${member.id}`, admin);
  const plans = await prisma.pjp.findMany({
    where: { userId: member.id, date: wibDayRange(date) },
    include: { stops: true },
  });
  const expectedPlanned = plans.flatMap((p) => p.stops).filter(countsAsPlannedVisit).length;
  assert.equal(report.summary.totalPlanCalls, expectedPlanned);
  assert.equal(report.rows.filter((r) => r.planCall === 'Y').length, expectedPlanned);

  const historical = await prisma.pjp.findFirst({
    where: { userId: member.id, status: 'COMPLETED' },
    include: { stops: { include: { orders: true } } },
  });
  const historyDate = wibDateKey(historical.date);
  const historyReport = await get(`/daily-calls?date=${historyDate}&userId=${member.id}`, admin);
  assert.equal(
    historyReport.summary.totalOrderAmount,
    historical.stops
      .flatMap((s) => s.orders)
      .filter((o) => o.status === 'APPROVED')
      .reduce((n, o) => n + o.totalValue, 0)
  );
  assert.ok(historyReport.summary.totalOrderAmount > 0);

  const clusters = await prisma.cluster.findMany({
    where: { deletedAt: null },
    include: { outlets: { where: { deletedAt: null }, select: { type: true } } },
  });
  assert.equal(clusters.length, 5);
  assert.ok(
    clusters.every((c) => new Set(c.outlets.map((o) => o.type)).size <= 1),
    'A cluster must never mix GT and MT'
  );
  assert.ok(
    clusters.every((c) => c.outletCount === c.outlets.length),
    'Cluster outletCount must match actual outlets'
  );
  assert.equal(
    clusters.reduce((n, c) => n + c.outlets.length, 0),
    443,
    'All 443 outlets must belong to active clusters'
  );

  for (const driver of users.filter((u) => u.role === 'SUPIR')) {
    const routes = await get(`/delivery/routes?date=${date}`, driver);
    assert.ok(routes.items.length > 0, `${driver.name} must have an active delivery route`);
    assert.ok(routes.items.every((r) => r.driverId === driver.id));
  }

  console.log(
    'Belfoods workspace API verification passed: all 443 outlets, role access, PostgreSQL reports, populated templates, homogeneous clusters and 4 driver routes.'
  );
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
}
