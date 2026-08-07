import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Clusters
  const clusterCimahi = await prisma.cluster.upsert({
    where: { id: 'cluster-cmh-01' },
    update: {},
    create: {
      id: 'cluster-cmh-01',
      name: 'Cluster Cimahi & Bandung Barat',
      region: 'Cimahi - Bandung Barat',
    },
  });

  // 2. Create Outlets
  const outletA = await prisma.outlet.upsert({
    where: { id: 'outlet-tb-01' },
    update: {},
    create: {
      id: 'outlet-tb-01',
      name: 'Toko Berkah Utama',
      address: 'Jl. H. Amir Machmud No. 12, Cimahi',
      latitude: -6.8722,
      longitude: 107.5423,
      clusterId: clusterCimahi.id,
    },
  });

  const outletB = await prisma.outlet.upsert({
    where: { id: 'outlet-tj-02' },
    update: {},
    create: {
      id: 'outlet-tj-02',
      name: 'Toko Jaya Abadi',
      address: 'Jl. Raya Padalarang No. 45, Bandung Barat',
      latitude: -6.8375,
      longitude: 107.4764,
      clusterId: clusterCimahi.id,
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
      clusterId: clusterCimahi.id,
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
