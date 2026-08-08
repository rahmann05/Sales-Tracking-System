import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with full production-matched data...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ─── 1. Clusters ────────────────────────────────────────────────────────────
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

  // ─── 2. Outlets (30 Total, 10 per cluster) ──────────────────────────────────
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
        creditLimit: 15000000,
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
        creditLimit: 12000000,
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
        creditLimit: 10000000,
        outstanding: 1500000,
        radiusMeters: 50,
      },
    });
    createdLembangOutlets.push(o);
  }

  // ─── 3. Users (All Roles) ───────────────────────────────────────────────────
  await prisma.user.upsert({
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

  await prisma.user.upsert({
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

  await prisma.user.upsert({
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

  // ─── 4. Products (Full Catalog) ─────────────────────────────────────────────
  const productsData = [
    { sku: 'SKU-001', name: 'Minyak Goreng Sawit 2L', category: 'Sembako', price: 34000, stock: 150 },
    { sku: 'SKU-002', name: 'Gula Pasir Kristal 1kg', category: 'Sembako', price: 17500, stock: 300 },
    { sku: 'SKU-003', name: 'Beras Premium Super 5kg', category: 'Sembako', price: 72000, stock: 80 },
    { sku: 'SKU-004', name: 'Susu Kental Manis 370g', category: 'Minuman', price: 12500, stock: 220 },
    { sku: 'SKU-005', name: 'Kopi Bubuk Murni 200g', category: 'Minuman', price: 21000, stock: 140 },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  // ─── 5. Initial Today's PJPs (Scheduled for Sales) ───────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // PJP Budi (Cimahi Tengah - 10 stops)
  await prisma.pjp.create({
    data: {
      id: 'pjp-budi-today',
      userId: salesBudi.id,
      date: today,
      type: 'SALES',
      status: 'SCHEDULED',
      stops: {
        create: createdCimahiOutlets.map((o, idx) => ({
          outletId: o.id,
          sequence: idx + 1,
          status: 'PENDING',
        })),
      },
    },
  });

  // PJP Siti (Padalarang - 10 stops)
  await prisma.pjp.create({
    data: {
      id: 'pjp-siti-today',
      userId: salesSiti.id,
      date: today,
      type: 'SALES',
      status: 'SCHEDULED',
      stops: {
        create: createdPadalarangOutlets.map((o, idx) => ({
          outletId: o.id,
          sequence: idx + 1,
          status: 'PENDING',
        })),
      },
    },
  });

  // PJP Agus (Lembang - 10 stops)
  await prisma.pjp.create({
    data: {
      id: 'pjp-agus-today',
      userId: salesAgus.id,
      date: today,
      type: 'SALES',
      status: 'SCHEDULED',
      stops: {
        create: createdLembangOutlets.map((o, idx) => ({
          outletId: o.id,
          sequence: idx + 1,
          status: 'PENDING',
        })),
      },
    },
  });

  console.log('✅ Seeding completed! Full production-matched database ready.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
