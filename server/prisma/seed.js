import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { assertDemoDatabase, seedDate } from './seeds/context.js';
import { seedMaster } from './seeds/master.js';
import { seedLegacyStaff } from './seeds/legacy-staff.js';
import { seedCoverage } from './seeds/coverage.js';
import { seedSales } from './seeds/sales.js';
import { seedStaff } from './seeds/staff.js';
import { seedWarehouse } from './seeds/warehouse.js';
const prisma = new PrismaClient();
try {
  assertDemoDatabase();
  const dateKey = seedDate();
  await prisma.$transaction(async db => {
    const master = await seedMaster(db);
    const cohorts=await seedCoverage(db,master,dateKey);
    const plans = await seedSales(db, master, dateKey);
    await seedStaff(db, master, plans, dateKey);
    await seedWarehouse(db, master, dateKey);
    await seedLegacyStaff(db,master,dateKey);
    for(const cohort of cohorts){
      const extraPlans=await seedSales(db,cohort,dateKey,cohort.namespace);
      await seedStaff(db,cohort,extraPlans,dateKey,cohort.namespace);
    }
  }, {timeout:120000,maxWait:10000});
  console.log(`Seed demo lengkap untuk ${dateKey}: 5 role, tim demo dan tim supervisor bawaan, kluster GT/MT terpisah, riwayat 14 hari, katalog, konfigurasi, PJP, approval, audit, packing, alokasi armada dan retur. Data lama, sandi, konfigurasi dan status tidak ditimpa.`);
} catch (error) {
  console.error(error.message);
  process.exitCode=1;
} finally { await prisma.$disconnect(); }
