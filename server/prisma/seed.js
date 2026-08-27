import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Seeding database with production dataset...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Clusters
  const clusterCimahi = await prisma.cluster.upsert({
    where: { id: 'cluster-cmh-01' },
    update: {},
    create: {
      id: 'cluster-cmh-01',
      name: 'Klaster Cimahi Tengah',
      region: 'Region Cimahi - Bandung Barat',
    },
  });

  const clusterPadalarang = await prisma.cluster.upsert({
    where: { id: 'cluster-pdl-01' },
    update: {},
    create: {
      id: 'cluster-pdl-01',
      name: 'Klaster Padalarang',
      region: 'Region Cimahi - Bandung Barat',
    },
  });

  const clusterLembang = await prisma.cluster.upsert({
    where: { id: 'cluster-lmb-01' },
    update: {},
    create: {
      id: 'cluster-lmb-01',
      name: 'Klaster Lembang',
      region: 'Region Cimahi - Bandung Barat',
    },
  });

  // 2. Outlets (30 Total, 10 per cluster)
  const cimahiOutletsData = [
    { name: 'Toko Sumber Rezeki', owner: 'Hj. Aminah', phone: '0812-3456-7890', address: 'Jl. Raya Amir Machmud No. 12, Cimahi', lat: -6.8722, lng: 107.5423 },
    { name: 'Toko Harapan Bersama', owner: 'Pak Mulyadi', phone: '0812-9988-7766', address: 'Jl. Cihanjuang No. 45, Cimahi', lat: -6.875, lng: 107.545 },
    { name: 'Kelontong Jaya Makmur', owner: 'Ibu Ratna', phone: '0813-1122-3344', address: 'Jl. Pesantren No. 88, Cimahi', lat: -6.868, lng: 107.539 },
    { name: 'Grosir Berkah Cimahi', owner: 'H. Dudung', phone: '0812-4455-6677', address: 'Jl. Mahar Martanegara No. 102, Cimahi', lat: -6.879, lng: 107.541 },
    { name: 'Minimarket Abadi', owner: 'Pak Tommy', phone: '0815-6677-8899', address: 'Jl. Gandawijaya No. 15, Cimahi', lat: -6.871, lng: 107.548 },
    { name: 'Warung Sembako Barokah', owner: 'Ibu Eni', phone: '0812-3322-1100', address: 'Jl. Kolonel Masturi No. 67, Cimahi', lat: -6.865, lng: 107.543 },
    { name: 'Toko Rezeki Utama', owner: 'Pak Hendra', phone: '0813-7788-9900', address: 'Jl. Sangkuriang No. 23, Cimahi', lat: -6.8765, lng: 107.536 },
    { name: 'Agen Snack Cimahi', owner: 'Ibu Yanti', phone: '0812-5544-3322', address: 'Jl. Kerkof No. 90, Leuwigajah', lat: -6.881, lng: 107.5445 },
    { name: 'Minimarket Melati', owner: 'Pak Usman', phone: '0813-9900-1122', address: 'Jl. Gatot Subroto No. 40, Cimahi', lat: -6.8695, lng: 107.551 },
    { name: 'Toko Mulia Sembako', owner: 'Hj. Ningsih', phone: '0812-8877-6655', address: 'Jl. Baros No. 18, Cimahi', lat: -6.8735, lng: 107.5385 },
  ];

  const createdCimahiOutlets = [];
  for (let i = 0; i < cimahiOutletsData.length; i++) {
    const d = cimahiOutletsData[i];
    const o = await prisma.outlet.upsert({
      where: { id: `outlet-cmh-${i + 1}` },
      update: {},
      create: {
        id: `outlet-cmh-${i + 1}`,
        outletCode: `CUST-00${i + 1}`,
        name: d.name,
        ownerName: d.owner,
        phone: d.phone,
        address: d.address,
        latitude: d.lat,
        longitude: d.lng,
        clusterId: clusterCimahi.id,
        outstanding: 3500000,
        radiusMeters: 50,
      },
    });
    createdCimahiOutlets.push(o);
  }

  const padalarangOutletsData = [
    { name: 'Minimarket Maju Jaya', owner: 'Pak Koes', phone: '0813-8888-9999', address: 'Jl. Raya Padalarang No. 88, KBB', lat: -6.8375, lng: 107.4764 },
    { name: 'Toko Sembako Sejahtera', owner: 'Pak Dadang', phone: '0812-1111-2222', address: 'Jl. Stasiun Padalarang No. 12, KBB', lat: -6.839, lng: 107.479 },
    { name: 'Grosir Padalarang Indah', owner: 'H. Anwar', phone: '0813-3333-4444', address: 'Jl. Tagog Padalarang No. 55, KBB', lat: -6.835, lng: 107.473 },
    { name: 'Warung Kelontong Pak Eko', owner: 'Pak Eko', phone: '0811-5555-6666', address: 'Jl. Purwakarta No. 104, Padalarang', lat: -6.8415, lng: 107.4755 },
    { name: 'Agen Sembako Baraya', owner: 'Ibu Maya', phone: '0812-7777-8888', address: 'Jl. Kertajaya No. 33, Padalarang', lat: -6.832, lng: 107.481 },
    { name: 'Toko Murah Meriah', owner: 'Pak Herman', phone: '0813-9999-0000', address: 'Jl. Simpang Padalarang No. 70, KBB', lat: -6.844, lng: 107.478 },
    { name: 'Minimarket Sentosa Padalarang', owner: 'Ibu Rina', phone: '0812-2233-4411', address: 'Jl. Cemerlang No. 89, KBB', lat: -6.836, lng: 107.485 },
    { name: 'Toko Berkah Mandiri', owner: 'Pak Joko', phone: '0813-4455-6622', address: 'Jl. Panaris No. 14, Padalarang', lat: -6.84, lng: 107.471 },
    { name: 'Warung Sembako Bu Cici', owner: 'Bu Cici', phone: '0811-6677-8833', address: 'Jl. Ciburuy No. 25, Padalarang', lat: -6.831, lng: 107.4775 },
    { name: 'Grosir Utama Padalarang', owner: 'Pak Budianto', phone: '0812-8899-0044', address: 'Jl. Kota Baru Parahyangan No. 5, KBB', lat: -6.843, lng: 107.4835 },
  ];

  const createdPadalarangOutlets = [];
  for (let i = 0; i < padalarangOutletsData.length; i++) {
    const d = padalarangOutletsData[i];
    const o = await prisma.outlet.upsert({
      where: { id: `outlet-pdl-${i + 1}` },
      update: {},
      create: {
        id: `outlet-pdl-${i + 1}`,
        outletCode: `CUST-01${i + 1}`,
        name: d.name,
        ownerName: d.owner,
        phone: d.phone,
        address: d.address,
        latitude: d.lat,
        longitude: d.lng,
        clusterId: clusterPadalarang.id,
        outstanding: 2000000,
        radiusMeters: 50,
      },
    });
    createdPadalarangOutlets.push(o);
  }

  const lembangOutletsData = [
    { name: 'Toko Kelontong Berkah', owner: 'Ibu Susanti', phone: '0811-2233-4455', address: 'Jl. Tangkuban Perahu No. 45, Lembang', lat: -6.8142, lng: 107.6144 },
    { name: 'Minimarket Lembang Asri', owner: 'Pak Gunawan', phone: '0812-3344-5566', address: 'Jl. Raya Lembang No. 120, Lembang', lat: -6.8165, lng: 107.618 },
    { name: 'Warung Sembako Tangkuban', owner: 'Ibu Kartini', phone: '0813-5566-7788', address: 'Jl. Cikole No. 18, Lembang', lat: -6.811, lng: 107.611 },
    { name: 'Grosir Sayur & Sembako Jaya', owner: 'Pak Cecep', phone: '0811-7788-9900', address: 'Jl. Pasar Lembang No. 5, Lembang', lat: -6.819, lng: 107.6155 },
    { name: 'Toko Melati Lembang', owner: 'Bu Melati', phone: '0812-9900-1122', address: 'Jl. Maribaya No. 34, Lembang', lat: -6.808, lng: 107.617 },
    { name: 'Agen Minuman Lembang', owner: 'Pak Wawan', phone: '0813-1122-3344', address: 'Jl. Grand Hotel No. 12, Lembang', lat: -6.821, lng: 107.612 },
    { name: 'Warung Warga Bersama', owner: 'Ibu Nunung', phone: '0812-3344-5511', address: 'Jl. Jayagiri No. 80, Lembang', lat: -6.813, lng: 107.62 },
    { name: 'Minimarket Panorama', owner: 'Pak Sony', phone: '0813-5566-7722', address: 'Jl. Panorama No. 44, Lembang', lat: -6.8175, lng: 107.609 },
    { name: 'Toko Sembako Harapan', owner: 'Pak Ridwan', phone: '0811-7788-9933', address: 'Jl. Sesko AU No. 9, Lembang', lat: -6.8095, lng: 107.6135 },
    { name: 'Grosir Berkah Lembang', owner: 'Hj. Kokom', phone: '0812-9900-1144', address: 'Jl. Barukai No. 60, Lembang', lat: -6.8225, lng: 107.6165 },
  ];

  const createdLembangOutlets = [];
  for (let i = 0; i < lembangOutletsData.length; i++) {
    const d = lembangOutletsData[i];
    const o = await prisma.outlet.upsert({
      where: { id: `outlet-lmb-${i + 1}` },
      update: {},
      create: {
        id: `outlet-lmb-${i + 1}`,
        outletCode: `CUST-02${i + 1}`,
        name: d.name,
        ownerName: d.owner,
        phone: d.phone,
        address: d.address,
        latitude: d.lat,
        longitude: d.lng,
        clusterId: clusterLembang.id,
        outstanding: 1500000,
        radiusMeters: 50,
      },
    });
    createdLembangOutlets.push(o);
  }

  // 3. Users (Clean Roles)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sinaranugrah.com' },
    update: {},
    create: {
      id: 'usr-admin-1',
      name: 'Maria Ulfah',
      email: 'admin@sinaranugrah.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const opsUser = await prisma.user.upsert({
    where: { email: 'ops@sinaranugrah.com' },
    update: {},
    create: {
      id: 'usr-ops-1',
      name: 'Bambang Suroso',
      email: 'ops@sinaranugrah.com',
      password: hashedPassword,
      role: 'MANAJER_OPERASIONAL',
    },
  });

  const spvUser = await prisma.user.upsert({
    where: { email: 'spv@sinaranugrah.com' },
    update: {},
    create: {
      id: 'usr-spv-1',
      name: 'Ahmad Subagja',
      email: 'spv@sinaranugrah.com',
      password: hashedPassword,
      role: 'SUPERVISOR',
    },
  });

  const salesBudi = await prisma.user.upsert({
    where: { email: 'sales@sinaranugrah.com' },
    update: {},
    create: {
      id: 'usr-sales-1',
      name: 'Budi Santoso',
      email: 'sales@sinaranugrah.com',
      password: hashedPassword,
      role: 'SALES',
      clusterId: clusterCimahi.id,
    },
  });

  const salesSiti = await prisma.user.upsert({
    where: { email: 'siti@sinaranugrah.com' },
    update: {},
    create: {
      id: 'usr-sales-2',
      name: 'Siti Rahma',
      email: 'siti@sinaranugrah.com',
      password: hashedPassword,
      role: 'SALES',
      clusterId: clusterPadalarang.id,
    },
  });

  const salesAgus = await prisma.user.upsert({
    where: { email: 'agus@sinaranugrah.com' },
    update: {},
    create: {
      id: 'usr-sales-3',
      name: 'Agus Wijaya',
      email: 'agus@sinaranugrah.com',
      password: hashedPassword,
      role: 'SALES',
      clusterId: clusterLembang.id,
    },
  });

  const salesDedi = await prisma.user.upsert({
    where: { email: 'dedi@sinaranugrah.com' },
    update: {},
    create: {
      id: 'usr-sales-4',
      name: 'Dedi Kurniawan',
      email: 'dedi@sinaranugrah.com',
      password: hashedPassword,
      role: 'SALES',
      clusterId: clusterCimahi.id,
    },
  });

  const salesRina = await prisma.user.upsert({
    where: { email: 'rina@sinaranugrah.com' },
    update: {},
    create: {
      id: 'usr-sales-5',
      name: 'Rina Marlina',
      email: 'rina@sinaranugrah.com',
      password: hashedPassword,
      role: 'SALES',
      clusterId: clusterPadalarang.id,
    },
  });

  // 4. Initial Today's PJPs and Historical Visits with Attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Helper to upsert PJP cleanly with stops & attendances
  const upsertPjpWithStops = async (pjpId, userId, outlets, completedCount = 0, pjpDate = today) => {
    // Delete existing stops for this seed PJP to avoid duplication
    await prisma.pjpStop.deleteMany({ where: { pjpId } });

    const pjp = await prisma.pjp.upsert({
      where: { id: pjpId },
      update: {
        userId,
        date: pjpDate,
        type: 'SALES',
        status: completedCount >= outlets.length ? 'COMPLETED' : completedCount > 0 ? 'IN_PROGRESS' : 'SCHEDULED',
        stops: {
          create: outlets.map((o, idx) => ({
            outletId: o.id,
            sequence: idx + 1,
            status: idx < completedCount ? 'VISITED' : 'PENDING',
          })),
        },
      },
      create: {
        id: pjpId,
        userId,
        date: pjpDate,
        type: 'SALES',
        status: completedCount >= outlets.length ? 'COMPLETED' : completedCount > 0 ? 'IN_PROGRESS' : 'SCHEDULED',
        stops: {
          create: outlets.map((o, idx) => ({
            outletId: o.id,
            sequence: idx + 1,
            status: idx < completedCount ? 'VISITED' : 'PENDING',
          })),
        },
      },
      include: { stops: true },
    });

    // Create Attendances for visited stops
    for (let i = 0; i < completedCount && i < pjp.stops.length; i++) {
      const stop = pjp.stops[i];
      const outlet = outlets[i];
      const duration = 15 + (i % 3) * 5; // 15, 20, 25 mins
      const orderAmount = 250000 + i * 125000;
      const skuCount = 2 + (i % 4);
      const deviation = 10 + (i % 5) * 4; // 10m - 26m (well within 50m geofence)

      await prisma.attendance.create({
        data: {
          pjpStopId: stop.id,
          userId,
          type: 'IN',
          latitude: outlet.latitude || -6.8722,
          longitude: outlet.longitude || 107.5423,
          photoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=60',
          notes: 'Kunjungan Rutin & Cek Stok Toko',
          deviationMeters: deviation,
          distanceWarning: 'OK',
          timestamp: new Date(pjpDate.getTime() + (i * 35 + 480) * 60000), // 08:00 + 35 mins each
        },
      });

      await prisma.attendance.create({
        data: {
          pjpStopId: stop.id,
          userId,
          type: 'OUT',
          latitude: outlet.latitude || -6.8722,
          longitude: outlet.longitude || 107.5423,
          photoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=60',
          notes: 'Kunjungan Selesai & Transaksi Berhasil',
          durationMinutes: duration,
          deviationMeters: deviation,
          distanceWarning: 'OK',
          orderAmount: orderAmount,
          skuSold: skuCount,
          isEffectiveCall: true,
          timestamp: new Date(pjpDate.getTime() + (i * 35 + 480 + duration) * 60000),
        },
      });
    }
  };

  // Seed Today's PJPs for Sales Team
  await upsertPjpWithStops('pjp-budi-today', salesBudi.id, createdCimahiOutlets, 5, today);
  await upsertPjpWithStops('pjp-siti-today', salesSiti.id, createdPadalarangOutlets, 4, today);
  await upsertPjpWithStops('pjp-agus-today', salesAgus.id, createdLembangOutlets, 3, today);
  await upsertPjpWithStops('pjp-dedi-today', salesDedi.id, createdCimahiOutlets, 2, today);
  await upsertPjpWithStops('pjp-rina-today', salesRina.id, createdPadalarangOutlets, 4, today);

  // Seed Yesterday's Completed PJPs for Reports
  await upsertPjpWithStops('pjp-budi-yest', salesBudi.id, createdCimahiOutlets, 10, yesterday);
  await upsertPjpWithStops('pjp-siti-yest', salesSiti.id, createdPadalarangOutlets, 10, yesterday);
  await upsertPjpWithStops('pjp-agus-yest', salesAgus.id, createdLembangOutlets, 9, yesterday);

  // Seed Off-PJP Attendance
  await prisma.offPjpAttendance.upsert({
    where: { id: 'off-pjp-1' },
    update: {},
    create: {
      id: 'off-pjp-1',
      userId: salesBudi.id,
      outletName: 'Warung Barokah Bu Siti',
      customerName: 'Ibu Siti',
      phone: '0812-9876-5432',
      address: 'Jl. Mahar Martanegara No. 50, Cimahi',
      latitude: -6.8788,
      longitude: 107.5412,
      reason: 'Prospek outlet baru potensial & repeat order darurat',
      status: 'PENDING',
    },
  });

  await prisma.offPjpAttendance.upsert({
    where: { id: 'off-pjp-2' },
    update: {},
    create: {
      id: 'off-pjp-2',
      userId: salesSiti.id,
      outletName: 'Toko Kelontong Baraya',
      customerName: 'Pak Dadan',
      phone: '0813-7766-5544',
      address: 'Jl. Raya Tagog No. 12, Padalarang',
      latitude: -6.8365,
      longitude: 107.4755,
      reason: 'Kunjungan follow up komplain pengiriman produk',
      status: 'APPROVED',
      validatedBy: spvUser.id,
      validatedAt: new Date(),
    },
  });

  // 5. Seed Customer Registrations (Pengajuan Toko Baru)
  const registrationsData = [
    {
      id: 'reg-sub-01',
      name: 'Toko Sumber Barokah Cimahi',
      ownerName: 'Hj. Aminah',
      phone: '0812-3456-7890',
      address: 'Jl. Kolonel Masturi No. 88, Cimahi',
      locationType: 'PINGGIR_JALAN',
      taxType: 'NON_PKP',
      taxNumber: '3277014502850001',
      taxName: 'Hj. Aminah',
      taxAddress: 'Jl. Kolonel Masturi No. 88, Cimahi',
      area: 'CIMAHI',
      subAreaKecamatan: 'Cimahi Utara',
      kelurahan: 'Cipageran',
      city: 'CIMAHI',
      division: 'UNICHARM',
      channel: 'GENERAL_TRADE',
      subChannel: 'TOKO_RETAIL',
      channelTier: 'BRONZE_C',
      paymentType: 'CASH',
      cashMethod: 'TUNAI',
      termOfPaymentDays: 0,
      visitWeekSchedule: 'ALL_WEEK',
      visitDays: 'SENIN,KAMIS',
      latitude: -6.8655,
      longitude: 107.5428,
      salesmanId: salesBudi.id,
      salesmanName: salesBudi.name,
      registrationStatus: 'SUBMITTED',
      createdAt: new Date(),
    },
    {
      id: 'reg-sub-02',
      name: 'Minimarket Baraya Padalarang',
      ownerName: 'Pak Hendra',
      phone: '0813-8899-7766',
      address: 'Jl. Raya Padalarang No. 104, KBB',
      locationType: 'PINGGIR_JALAN',
      taxType: 'PKP',
      taxNumber: '01.234.567.8-421.000',
      taxName: 'PT Baraya Mitra Sejahtera',
      taxAddress: 'Jl. Raya Padalarang No. 104, KBB',
      area: 'KAB_BANDUNG_BARAT',
      subAreaKecamatan: 'Padalarang',
      kelurahan: 'Kertajaya',
      city: 'KAB. BANDUNG BARAT',
      division: 'BELFOODS',
      channel: 'MODERN_TRADE',
      subChannel: 'CHAIN_MINIMARKET',
      channelTier: 'SILVER',
      paymentType: 'TOP',
      termOfPaymentDays: 14,
      visitWeekSchedule: 'WEEK_GANJIL',
      visitDays: 'SELASA,JUMAT',
      latitude: -6.8378,
      longitude: 107.4782,
      salesmanId: salesSiti.id,
      salesmanName: salesSiti.name,
      registrationStatus: 'SUBMITTED',
      createdAt: new Date(),
    },
    {
      id: 'reg-spv-01',
      name: 'Grosir Sembako Rezeki Lembang',
      ownerName: 'H. Dudung',
      phone: '0811-2233-4455',
      address: 'Jl. Raya Lembang No. 45, Lembang',
      locationType: 'DALAM_PASAR',
      taxType: 'NON_PKP',
      taxNumber: '3217015509780003',
      taxName: 'H. Dudung',
      taxAddress: 'Jl. Raya Lembang No. 45, Lembang',
      area: 'KAB_BANDUNG_BARAT',
      subAreaKecamatan: 'Lembang',
      kelurahan: 'Kayuambon',
      city: 'KAB. BANDUNG BARAT',
      division: 'UNICHARM',
      channel: 'GENERAL_TRADE',
      subChannel: 'GROSIR',
      channelTier: 'GOLD',
      paymentType: 'TRANSFER',
      termOfPaymentDays: 0,
      visitWeekSchedule: 'ALL_WEEK',
      visitDays: 'RABU,SABTU',
      latitude: -6.8185,
      longitude: 107.6172,
      salesmanId: salesAgus.id,
      salesmanName: salesAgus.name,
      registrationStatus: 'SPV_APPROVED',
      spvName: spvUser.name,
      spvApprovedAt: new Date(),
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: 'reg-ops-01',
      name: 'Toko Aneka Snack Leuwigajah',
      ownerName: 'Ibu Ratna',
      phone: '0812-7788-9900',
      address: 'Jl. Kerkof No. 22, Leuwigajah, Cimahi Selatan',
      locationType: 'PINGGIR_JALAN',
      taxType: 'NON_PKP',
      taxNumber: '3277026607890002',
      taxName: 'Ibu Ratna',
      taxAddress: 'Jl. Kerkof No. 22, Leuwigajah',
      area: 'CIMAHI',
      subAreaKecamatan: 'Cimahi Selatan',
      kelurahan: 'Leuwigajah',
      city: 'CIMAHI',
      division: 'GENERAL',
      channel: 'GENERAL_TRADE',
      subChannel: 'TOKO_RETAIL',
      channelTier: 'BRONZE_B',
      paymentType: 'CASH',
      cashMethod: 'TUNAI',
      termOfPaymentDays: 0,
      visitWeekSchedule: 'ALL_WEEK',
      visitDays: 'SENIN,KAMIS',
      latitude: -6.8821,
      longitude: 107.5451,
      salesmanId: salesDedi.id,
      salesmanName: salesDedi.name,
      registrationStatus: 'OPS_APPROVED',
      spvName: spvUser.name,
      spvApprovedAt: new Date(Date.now() - 86400000),
      opsManagerName: opsUser.name,
      opsApprovedAt: new Date(),
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: 'reg-act-01',
      customerCode: 'PVC0088',
      name: 'Minimarket Melati Cihanjuang',
      ownerName: 'Pak Tommy',
      phone: '0813-1122-3344',
      address: 'Jl. Cihanjuang No. 120, Cimahi',
      locationType: 'KOMPLEK_PERUMAHAN',
      taxType: 'PKP',
      taxNumber: '02.456.789.0-421.000',
      taxName: 'PT Melati Retail Indonesia',
      taxAddress: 'Jl. Cihanjuang No. 120, Cimahi',
      area: 'CIMAHI',
      subAreaKecamatan: 'Cimahi Utara',
      kelurahan: 'Cihanjuang',
      city: 'CIMAHI',
      division: 'UNICHARM',
      channel: 'MODERN_TRADE',
      subChannel: 'LOKAL_MINIMARKET',
      channelTier: 'SILVER',
      paymentType: 'TOP',
      termOfPaymentDays: 7,
      visitWeekSchedule: 'ALL_WEEK',
      visitDays: 'SENIN,RABU,JUMAT',
      latitude: -6.8715,
      longitude: 107.5488,
      salesmanId: salesBudi.id,
      salesmanName: salesBudi.name,
      registrationStatus: 'REGISTERED_ACTIVE',
      spvName: spvUser.name,
      spvApprovedAt: new Date(Date.now() - 86400000 * 3),
      opsManagerName: opsUser.name,
      opsApprovedAt: new Date(Date.now() - 86400000 * 2),
      adminName: adminUser.name,
      adminRegisteredAt: new Date(Date.now() - 86400000),
      createdAt: new Date(Date.now() - 86400000 * 4),
    },
    {
      id: 'reg-rej-01',
      name: 'Warung Bu Cici Ciburuy',
      ownerName: 'Bu Cici',
      phone: '0811-6677-8833',
      address: 'Jl. Ciburuy No. 25, Padalarang',
      locationType: 'PINGGIR_JALAN',
      taxType: 'NON_PKP',
      area: 'KAB_BANDUNG_BARAT',
      subAreaKecamatan: 'Padalarang',
      kelurahan: 'Ciburuy',
      city: 'KAB. BANDUNG BARAT',
      division: 'UNICHARM',
      channel: 'GENERAL_TRADE',
      subChannel: 'TOKO_RETAIL',
      paymentType: 'CASH',
      visitWeekSchedule: 'ALL_WEEK',
      visitDays: 'SELASA',
      latitude: -6.8315,
      longitude: 107.4772,
      salesmanId: salesRina.id,
      salesmanName: salesRina.name,
      registrationStatus: 'REJECTED',
      rejectionNote: 'Toko telah tutup permanen saat verifikasi fisik',
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
  ];

  for (const reg of registrationsData) {
    await prisma.customerRegistration.upsert({
      where: { id: reg.id },
      update: reg,
      create: reg,
    });
  }

  console.log('[SUCCESS] Database seed completed with SPV team, attendance, visits, and customer registrations.');
}

main()
  .catch((e) => {
    console.error('[ERROR] Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
