import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create 3 Clusters under 1 Region (Region Cimahi - Bandung Barat)
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

  // 2. Create 30 Outlets (10 per cluster)
  const cimahiOutlets = [
    'Toko Sumber Rezeki', 'Toko Harapan Bersama', 'Kelontong Jaya Makmur', 'Grosir Berkah Cimahi', 'Minimarket Abadi',
    'Warung Sembako Barokah', 'Toko Rezeki Utama', 'Agen Snack Cimahi', 'Minimarket Melati', 'Toko Mulia Sembako'
  ];
  for (let i = 0; i < cimahiOutlets.length; i++) {
    await prisma.outlet.upsert({
      where: { id: `outlet-cmh-${i + 1}` },
      update: {},
      create: {
        id: `outlet-cmh-${i + 1}`,
        name: cimahiOutlets[i],
        address: `Jl. Raya Cimahi No. ${10 + i}, Cimahi`,
        latitude: -6.8722 + i * 0.001,
        longitude: 107.5423 + i * 0.001,
        clusterId: clusterCimahi.id,
      },
    });
  }

  const padalarangOutlets = [
    'Minimarket Maju Jaya', 'Toko Sembako Sejahtera', 'Grosir Padalarang Indah', 'Warung Kelontong Pak Eko', 'Agen Sembako Baraya',
    'Toko Murah Meriah', 'Minimarket Sentosa Padalarang', 'Toko Berkah Mandiri', 'Warung Sembako Bu Cici', 'Grosir Utama Padalarang'
  ];
  for (let i = 0; i < padalarangOutlets.length; i++) {
    await prisma.outlet.upsert({
      where: { id: `outlet-pdl-${i + 1}` },
      update: {},
      create: {
        id: `outlet-pdl-${i + 1}`,
        name: padalarangOutlets[i],
        address: `Jl. Raya Padalarang No. ${20 + i}, KBB`,
        latitude: -6.8375 + i * 0.001,
        longitude: 107.4764 + i * 0.001,
        clusterId: clusterPadalarang.id,
      },
    });
  }

  const lembangOutlets = [
    'Toko Kelontong Berkah', 'Minimarket Lembang Asri', 'Warung Sembako Tangkuban', 'Grosir Sayur & Sembako Jaya', 'Toko Melati Lembang',
    'Agen Minuman Lembang', 'Warung Warga Bersama', 'Minimarket Panorama', 'Toko Sembako Harapan', 'Grosir Berkah Lembang'
  ];
  for (let i = 0; i < lembangOutlets.length; i++) {
    await prisma.outlet.upsert({
      where: { id: `outlet-lmb-${i + 1}` },
      update: {},
      create: {
        id: `outlet-lmb-${i + 1}`,
        name: lembangOutlets[i],
        address: `Jl. Tangkuban Perahu No. ${30 + i}, Lembang`,
        latitude: -6.8142 + i * 0.001,
        longitude: 107.6144 + i * 0.001,
        clusterId: clusterLembang.id,
      },
    });
  }

  // 3. Create Users
  await prisma.user.upsert({
    where: { email: 'admin@sinaranugrah.com' },
    update: {},
    create: {
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
      name: 'Budi Santoso',
      email: 'sales@sinaranugrah.com',
      password: hashedPassword,
      role: 'SALES',
      clusterId: clusterCimahi.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'driver@sinaranugrah.com' },
    update: {},
    create: {
      name: 'Hendra Wijaya',
      email: 'driver@sinaranugrah.com',
      password: hashedPassword,
      role: 'DRIVER',
      salesId: salesBudi.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'helper@sinaranugrah.com' },
    update: {},
    create: {
      name: 'Rian Putra',
      email: 'helper@sinaranugrah.com',
      password: hashedPassword,
      role: 'HELPER',
      salesId: salesBudi.id,
    },
  });

  // 4. Create Products
  await prisma.product.upsert({
    where: { sku: 'SKU-001' },
    update: {},
    create: {
      sku: 'SKU-001',
      name: 'Minyak Goreng Sawit 2L',
      price: 34000,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'SKU-002' },
    update: {},
    create: {
      sku: 'SKU-002',
      name: 'Beras Premium Super 5kg',
      price: 72000,
    },
  });

  console.log('✅ Seeding completed! 1 Region, 3 Clusters, 30 Outlets created.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
