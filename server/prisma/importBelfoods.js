import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const DAY_MAP = {
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  sabtu: 6,
  minggu: 0,
};

async function main() {
  console.log('[IMPORT] Memulai import data Belfoods ke database PostgreSQL...');

  const jsonPath = path.resolve(__dirname, '../../KUNJUNGAN_TOKO_BELFOODS_CONVERTED.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`[ERROR] File ${jsonPath} tidak ditemukan!`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const callplans = JSON.parse(rawData);
  console.log(`[INFO] Terdeteksi ${callplans.length} callplan dari file JSON.`);

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Buat / Pastikan Cluster Default (Bandung Raya & Sekitarnya)
  const defaultCluster = await prisma.cluster.upsert({
    where: { id: 'cluster-belfoods-01' },
    update: {},
    create: {
      id: 'cluster-belfoods-01',
      name: 'Klaster Belfoods Bandung Raya',
      region: 'Region Bandung Raya & Sekitarnya',
    },
  });

  let totalOutletsCreated = 0;
  let totalPjpsCreated = 0;
  let totalStopsCreated = 0;

  for (const cp of callplans) {
    const rawSalesName = cp.nama_sales || 'Sales Field Rep';
    const cleanName = rawSalesName.replace(/^SLD\d+\s*/i, '').trim() || rawSalesName;
    const emailPrefix = cleanName.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    const email = `${emailPrefix || 'sales'}@sinaranugrah.com`;

    // 2. Buat / Upsert Akun Sales
    const salesUser = await prisma.user.upsert({
      where: { email },
      update: {
        name: cleanName,
        clusterId: defaultCluster.id,
      },
      create: {
        name: cleanName,
        email,
        password: hashedPassword,
        role: 'SALES',
        clusterId: defaultCluster.id,
      },
    });

    console.log(`[USER] Sales: ${cleanName} (${email})`);

    // 3. Proses Jadwal Harian & Outlets
    const jadwalHarian = cp.jadwal_harian || {};

    for (const [dayKey, dayData] of Object.entries(jadwalHarian)) {
      const kunjunganList = dayData.kunjungan || [];
      if (kunjunganList.length === 0) continue;

      const targetDayOfWeek = DAY_MAP[dayKey.toLowerCase()] ?? 1;
      const today = new Date();
      const currentDay = today.getDay();
      const diff = targetDayOfWeek - currentDay;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + diff);
      targetDate.setHours(0, 0, 0, 0);

      const stopCreateData = [];

      for (let seq = 0; seq < kunjunganList.length; seq++) {
        const k = kunjunganList[seq];
        if (!k.latitude || !k.longitude) continue;

        const outletCode = k.customer_id || `CUST-BF-${Date.now()}-${seq}`;
        const outlet = await prisma.outlet.upsert({
          where: { outletCode },
          update: {
            name: k.customer_name || 'Toko Belfoods',
            address: k.address || 'Bandung',
            latitude: Number(k.latitude),
            longitude: Number(k.longitude),
          },
          create: {
            outletCode,
            name: k.customer_name || 'Toko Belfoods',
            address: k.address || 'Bandung',
            latitude: Number(k.latitude),
            longitude: Number(k.longitude),
            clusterId: defaultCluster.id,
            creditLimit: 15000000,
            outstanding: 0,
            radiusMeters: 50,
          },
        });
        totalOutletsCreated++;

        stopCreateData.push({
          outletId: outlet.id,
          sequence: seq + 1,
          status: 'PENDING',
        });
      }

      if (stopCreateData.length > 0) {
        const pjpId = `pjp-${salesUser.id.substring(0, 8)}-${dayKey}`;
        await prisma.pjp.upsert({
          where: { id: pjpId },
          update: {
            userId: salesUser.id,
            date: targetDate,
            status: 'SCHEDULED',
            type: 'SALES',
          },
          create: {
            id: pjpId,
            userId: salesUser.id,
            date: targetDate,
            status: 'SCHEDULED',
            type: 'SALES',
            stops: {
              create: stopCreateData,
            },
          },
        });
        totalPjpsCreated++;
        totalStopsCreated += stopCreateData.length;
      }
    }
  }

  console.log('--------------------------------------------');
  console.log('[SUCCESS] Import Selesai dengan Sukses!');
  console.log(`Total Outlet Terdaftar: ${totalOutletsCreated}`);
  console.log(`Total Jadwal PJP Dibuat: ${totalPjpsCreated}`);
  console.log(`Total Stops Rute Dibuat: ${totalStopsCreated}`);
  console.log('--------------------------------------------');
}

main()
  .catch((e) => {
    console.error('[ERROR] Error saat import data Belfoods:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
