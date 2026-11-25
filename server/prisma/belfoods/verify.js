import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { CONFIG_PARAMS } from '../../../shared/config.mjs';
import { evidenceImageError } from '../../../shared/evidence-image-policy.mjs';
import { invoiceReconciliation } from '../../../shared/invoice-reconciliation.mjs';
import { outletIssues } from '../../../shared/outlet-validation.mjs';
import { packingBalance } from '../../../shared/packing.mjs';
import { visitSalesResult } from '../../../shared/visit-metrics.mjs';
import { people, sourceData } from './context.js';

export const models = Prisma.dmmf.datamodel.models.map((m) => ({
  name: m.name,
  table: m.dbName || m.name,
  client: m.name[0].toLowerCase() + m.name.slice(1),
  key: m.fields.find((f) => f.isId).name,
}));

export async function snapshot(db) {
  const result = {};
  for (const m of models) {
    result[m.client] = await db[m.client].findMany({ orderBy: { [m.key]: 'asc' } });
  }
  return result;
}

export const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

const TEST_LABEL_RE =
  /(?:pengujian|(?<![a-zA-Z0-9_.-])(?:uji|test|testing|tesing|demo|fixture)(?![a-zA-Z0-9_.-])|uji-bf-|sampel\s+callplan|alamat\s+calon\s+outlet\s+simulasi)/i;

export async function verifyBelfoods(db, date, { exact = false } = {}) {
  const data = sourceData();
  const users = await db.user.findMany();
  const clusters = await db.cluster.findMany({
    include: { outlets: { where: { deletedAt: null } }, routes: true },
  });
  const outlets = await db.outlet.findMany({ include: { cluster: true } });
  const counts = {};
  for (const m of models) counts[m.name] = await db[m.client].count();

  // Every schema model must be populated and connected
  for (const m of models) {
    assert.ok(counts[m.name] > 0, `Tabel/model ${m.name} masih kosong`);
  }

  if (exact) {
    const assigned = data.outlets.filter((o) => o.assigned);
    const templates = new Set(assigned.map((o) => `${o.salesCode}:${o.dayOfWeek}:${o.weekType}`));
    assert.equal(users.length, 6);
    assert.equal(clusters.length, 5); // 4 territories + the unassigned placeholder
    assert.equal(outlets.length, 443);
    assert.equal(counts.Product, 12);
    assert.equal(counts.Vehicle, 11);
    assert.equal(counts.PjpTemplate, templates.size);
    assert.equal(counts.PjpTemplateStop, assigned.length);
    assert.equal(counts.CustomerRegistration, 4);
    assert.equal(counts.PackingList, 8);
    assert.equal(counts.DeliveryRoute, 4);
  }

  for (const role of ['ADMIN', 'SUPERVISOR', 'SALES', 'KEPALA_GUDANG', 'SUPIR']) {
    assert.ok(
      users.some((u) => u.role === role),
      `Role ${role} wajib ada`
    );
  }

  for (const user of users) {
    assert.ok(user.staffCode, `staffCode wajib terisi untuk ${user.email}`);
    assert.ok(user.roleCode, `roleCode wajib terisi untuk ${user.email}`);
    assert.ok(!user.email.endsWith('.test'), `Email demo (.test) masih ditemukan: ${user.email}`);
    assert.ok(!TEST_LABEL_RE.test(user.name), `Label test pada user: ${user.name}`);
  }

  for (const member of users.filter((u) => u.role === 'SALES')) {
    assert.ok(
      member.clusterId && member.supervisorId,
      `Sales ${member.name} wajib punya cluster & SPV`
    );
  }

  for (const cluster of clusters) {
    assert.equal(cluster.outletCount, cluster.outlets.length, `outletCount ${cluster.code}`);
    if (cluster.code === 'BF-UNASSIGNED') {
      assert.ok(
        !cluster.assignedSalesId && !cluster.supervisorId,
        'Cluster kosong harus tanpa Sales/SPV'
      );
      continue;
    }
    assert.equal(
      new Set(cluster.outlets.map((o) => o.type)).size,
      1,
      `Cluster ${cluster.code} harus homogen`
    );
    assert.ok(
      cluster.routes.some((r) => r.isActive),
      `Cluster ${cluster.code} wajib punya ClusterRoute aktif`
    );
    assert.ok(!TEST_LABEL_RE.test(cluster.name), `Label test pada cluster: ${cluster.name}`);
  }

  // Verify all 443 outlets from KUNJUNGAN_TOKO_BELFOODS_CONVERTED.json with zero business nulls
  for (const row of data.outlets) {
    const actual = outlets.find((o) => o.outletCode === row.customer_id);
    assert.ok(actual, `Outlet hilang: ${row.customer_id}`);
    assert.equal(actual.name, row.customer_name);
    assert.equal(actual.address, row.address);
    assert.equal(actual.latitude, row.latitude);
    assert.equal(actual.longitude, row.longitude);
    assert.ok(actual.latitude && actual.longitude, `Koordinat nol/null: ${row.customer_id}`);
    assert.ok(
      actual.ownerName && actual.phone && actual.taxName && actual.taxNumber,
      `Profil/pajak null: ${row.customer_id}`
    );
    assert.ok(
      actual.validatedAt && actual.validationConfidence != null && actual.googleLocation,
      `Validasi null: ${row.customer_id}`
    );
    assert.ok(
      !TEST_LABEL_RE.test(`${actual.name} ${actual.address}`),
      `Label test pada outlet: ${actual.outletCode}`
    );
    if (row.assigned)
      assert.equal(
        actual.cluster.assignedSalesId,
        users.find((u) => u.staffCode === row.salesCode).id,
        `Sales assignment tidak cocok pada ${row.customer_id}`
      );
    else
      assert.equal(
        actual.cluster.code,
        'BF-UNASSIGNED',
        `Outlet ${row.customer_id} harus belum ditugaskan`
      );
    if (actual.validationStatus !== 'WARNING') {
      assert.deepEqual(outletIssues(actual), [], `Outlet ${row.customer_id} masih memiliki issue`);
    }
  }

  for (const param of CONFIG_PARAMS) {
    assert.ok(await db.systemConfig.findUnique({ where: { key: param.key } }), param.key);
  }

  const registrations = await db.customerRegistration.findMany();
  assert.deepEqual(
    new Set(registrations.map((r) => r.registrationStatus)),
    new Set(['SUBMITTED', 'SPV_APPROVED', 'REGISTERED_ACTIVE', 'REJECTED'])
  );

  const vehicles = await db.vehicle.findMany();
  for (const vehicle of vehicles) {
    assert.ok(
      vehicle.maxCartons > 0 && vehicle.maxWeightKg > 0,
      `Kapasitas kendaraan 0: ${vehicle.code}`
    );
    assert.equal(
      evidenceImageError(vehicle.photoUrl),
      null,
      `Foto kendaraan tidak valid: ${vehicle.code}`
    );
  }

  const stops = await db.pjpStop.findMany({
    include: { orders: { include: { items: true } }, attendances: true },
  });
  for (const stop of stops) {
    const report = visitSalesResult(stop);
    const approved = stop.orders.filter((o) => o.status === 'APPROVED');
    assert.equal(
      report.orderAmount,
      approved.reduce((n, o) => n + o.totalValue, 0),
      `Total order pada stop ${stop.id} tidak sinkron`
    );
  }

  const orders = await db.order.findMany({ include: { items: true, pjpStop: true } });
  for (const order of orders) {
    assert.ok(
      order.outletId && order.pjpStopId,
      `Order ${order.code} wajib punya outletId & pjpStopId`
    );
    assert.equal(
      order.totalValue,
      order.items.reduce((n, i) => n + i.subtotal, 0),
      `Subtotal order ${order.code} tidak cocok`
    );
  }

  const packings = await db.packingList.findMany({
    include: { invoices: true, deliveryStops: true },
  });
  for (const packing of packings) {
    assert.ok(packing.sourceOrderId, `PackingList ${packing.code} wajib terhubung ke Order`);
    const balance = packingBalance(packing);
    assert.ok(balance.remainingCartons >= 0);
    assert.ok(balance.remainingItems.every((i) => i.remaining >= 0));
    assert.ok(balance.remainingInvoices.every((i) => i.remaining >= 0));
    for (const invoice of packing.invoices) {
      if (packing.loadPlanVersion !== 2) assert.equal(invoice.outletId, packing.outletId);
    }
    const reconciliation = invoiceReconciliation(packing);
    assert.deepEqual(reconciliation.errors, [], `Error rekonsiliasi faktur pada ${packing.code}`);
    assert.ok(
      reconciliation.invoices.every((i) => i.difference === 0),
      `Nilai faktur ${packing.code} tidak sesuai`
    );
  }

  assert.equal(people.length, 6);
  return { date, counts, sourceOutlets: data.outlets.length, status: 'PASS' };
}
