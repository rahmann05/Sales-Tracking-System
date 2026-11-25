import { at, email, ensure, id, note, people } from './context.js';
import { seedMaster } from './master.js';
import { seedSales } from './sales.js';
import { seedWarehouse } from './warehouse.js';

export async function seedBelfoods(db, date) {
  const master = await seedMaster(db, date);
  const sales = await seedSales(db, master, date);
  const warehouse = await seedWarehouse(db, master, sales, date);

  // Seed connected Notifications + NotificationOutbox records across operational actors
  const notices = [
    [
      'admin-noo',
      master.users.admin,
      'OUTLET_REGISTRATION',
      'Pengajuan outlet baru menunggu tinjauan',
      'Satu pengajuan outlet telah disetujui SPV dan siap diaktivasi Admin.',
      { tab: 'outlet-approval' },
    ],
    [
      'spv-gt-exception',
      master.supervisors[0],
      'MISSING_OUT',
      'Kunjungan tanpa check-out terdeteksi',
      'Periksa keterlambatan check-out salesman pada jadwal hari ini.',
      { tab: 'exceptions' },
    ],
    [
      'sales-yuli-field',
      master.sales[1],
      'OUTLET_FIELD_ASSIGNED',
      'Tugas pemeriksaan lapangan outlet',
      'Lakukan verifikasi papan nama dan GPS bangunan pada stop validasi hari ini.',
      { tab: 'sales-follow-up', outletFieldTask: id(`field-task-open-${date}`) },
    ],
    [
      'gudang-return',
      master.users.gudang,
      'DELIVERY_RETURN',
      'Retur pengiriman menunggu pemeriksaan gudang',
      'Satu karton penolakan kemasan perlu diperiksa fisik saat armada tiba.',
      { tab: 'delivery-monitor' },
    ],
  ];

  for (const [key, recipient, type, title, message, payload] of notices) {
    const notif = await ensure(db, 'notification', `notif-${key}-${date}`, {
      userId: recipient.id,
      type,
      title,
      message,
      payload,
      isRead: false,
      createdAt: at(date, '08:30'),
    });

    await ensure(db, 'notificationOutbox', `outbox-${key}-${date}`, {
      notificationId: notif.id,
      state: 'SENT',
      attempts: 1,
      nextAttemptAt: at(date, '08:30'),
      processedAt: at(date, '08:31'),
      createdAt: at(date, '08:30'),
    });
  }

  await db.systemConfig.upsert({
    where: { key: 'BELFOODS_UAT_SEED' },
    update: {},
    create: {
      key: 'BELFOODS_UAT_SEED',
      value: {
        version: 2,
        date,
        source: master.source.source,
        sourceSummary: master.source.summary,
        outletsCount: master.outlets.length,
        clustersCount: master.clusters.length,
        accounts: people.map(([key, name, role, staffCode]) => ({
          email: email(key),
          name,
          role,
          staffCode,
        })),
        note,
      },
      updatedAt: at(date, '06:00'),
    },
  });

  await ensure(db, 'auditEvent', `seed-connected-${date}`, {
    actorId: master.users.admin.id,
    actorName: master.users.admin.name,
    action: 'SEED_BELFOODS_CONNECTED',
    entityType: 'SEED',
    entityId: id(`seed-${date}`),
    before: { source: master.source.source },
    after: {
      date,
      sourceRows: master.source.summary.sourceRows,
      outlets: master.outlets.length,
      clusters: master.clusters.length,
      orders: sales.orders.length,
      packingLists: warehouse.packings.length,
      deliveryRoutes: warehouse.routes.length,
      vehicles: master.vehicles.length,
      note,
    },
    createdAt: at(date, '06:00'),
  });

  return {
    date,
    users: people.length,
    clusters: master.clusters.length,
    outlets: master.outlets.length,
    orders: sales.orders.length,
    packingLists: warehouse.packings.length,
    deliveryRoutes: warehouse.routes.length,
    vehicles: master.vehicles.length,
  };
}
