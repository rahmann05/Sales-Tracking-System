import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Clusters
  const clusterJakarta = await prisma.cluster.upsert({
    where: { id: 'cluster-jkt-01' },
    update: {},
    create: {
      id: 'cluster-jkt-01',
      name: 'Cluster Jakarta Selatan',
      region: 'DKI Jakarta',
    },
  });

  // 2. Create Outlets
  const outletA = await prisma.outlet.upsert({
    where: { id: 'outlet-tb-01' },
    update: {},
    create: {
      id: 'outlet-tb-01',
      name: 'Toko Berkah Utama',
      address: 'Jl. Fatmawati No. 12, Jakarta Selatan',
      latitude: -6.2915,
      longitude: 106.7974,
      clusterId: clusterJakarta.id,
    },
  });

  const outletB = await prisma.outlet.upsert({
    where: { id: 'outlet-tj-02' },
    update: {},
    create: {
      id: 'outlet-tj-02',
      name: 'Toko Jaya Abadi',
      address: 'Jl. Panglima Polim No. 45, Jakarta Selatan',
      latitude: -6.2443,
      longitude: 106.7991,
      clusterId: clusterJakarta.id,
    },
  });

  // 3. Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sinaranugrah.com' },
    update: {},
    create: {
      name: 'Admin Utama',
      email: 'admin@sinaranugrah.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@sinaranugrah.com' },
    update: {},
    create: {
      name: 'Budi Manajer',
      email: 'manager@sinaranugrah.com',
      password: hashedPassword,
      role: 'MANAJER_OPERASIONAL',
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'spv@sinaranugrah.com' },
    update: {},
    create: {
      name: 'Siti Supervisor',
      email: 'spv@sinaranugrah.com',
      password: hashedPassword,
      role: 'SUPERVISOR',
    },
  });

  const sales = await prisma.user.upsert({
    where: { email: 'sales@sinaranugrah.com' },
    update: {},
    create: {
      name: 'Andi Sales',
      email: 'sales@sinaranugrah.com',
      password: hashedPassword,
      role: 'SALES',
      clusterId: clusterJakarta.id,
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: 'driver@sinaranugrah.com' },
    update: {},
    create: {
      name: 'Deni Driver',
      email: 'driver@sinaranugrah.com',
      password: hashedPassword,
      role: 'DRIVER',
      salesId: sales.id,
    },
  });

  const helper = await prisma.user.upsert({
    where: { email: 'helper@sinaranugrah.com' },
    update: {},
    create: {
      name: 'Heri Helper',
      email: 'helper@sinaranugrah.com',
      password: hashedPassword,
      role: 'HELPER',
      salesId: sales.id,
    },
  });

  // 4. Create Products
  await prisma.product.upsert({
    where: { sku: 'PROD-001' },
    update: {},
    create: {
      sku: 'PROD-001',
      name: 'Minyak Goreng 2L',
      price: 34000,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'PROD-002' },
    update: {},
    create: {
      sku: 'PROD-002',
      name: 'Beras Premium 5kg',
      price: 72000,
    },
  });

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
