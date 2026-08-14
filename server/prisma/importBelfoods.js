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
  console.log('[IMPORT] Memulai import data Belfoods W1/W2 ke database PostgreSQL...');

  const jsonPath = path.resolve(__dirname, '../../Analisis/KUNJUNGAN_TOKO_BELFOODS_CONVERTED.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`[ERROR] File ${jsonPath} tidak ditemukan!`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const callplans = JSON.parse(rawData);
  console.log(`[INFO] Terdeteksi ${callplans.length} callplan dari file JSON.`);

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Hapus data PJP yang lama agar tidak duplikat dengan skema baru
  await prisma.pjpStop.deleteMany();
  await prisma.pjp.deleteMany();
  await prisma.pjpTemplateStop.deleteMany();
  await prisma.pjpTemplate.deleteMany();
  // Kita biarkan user & outlet tapi kita akan me-reassign cluster

  let totalOutletsCreated = 0;
  let totalTemplatesCreated = 0;
  let totalStopsCreated = 0;

  for (const cp of callplans) {
    const rawSalesName = cp.nama_sales || 'Sales Field Rep';
    
    // Deteksi W1 / W2
    let weekType = 'ALL';
    if (rawSalesName.toUpperCase().includes('W1')) weekType = 'WEEK_1';
    else if (rawSalesName.toUpperCase().includes('W2')) weekType = 'WEEK_2';

    // Bersihkan nama dari SLDxxx, W1, W2, dll
    const cleanName = rawSalesName
      .replace(/^SLD\d+\s*/i, '')
      .replace(/\bW[12]\b/ig, '')
      .replace(/[()]/g, '')
      .trim() || 'Sales';
      
    const emailPrefix = cleanName.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    const email = `${emailPrefix || 'sales'}@sinaranugrah.com`;

    // 1. Buat / Pastikan Cluster per Sales
    const clusterIdStr = `cluster-${emailPrefix}`;
    const cluster = await prisma.cluster.upsert({
      where: { id: clusterIdStr },
      update: {
        name: `Klaster ${cleanName}`,
      },
      create: {
        id: clusterIdStr,
        name: `Klaster ${cleanName}`,
        region: 'Region Bandung Raya & Sekitarnya',
      },
    });

    // 2. Buat / Upsert Akun Sales
    const salesUser = await prisma.user.upsert({
      where: { email },
      update: {
        name: cleanName,
        clusterId: cluster.id,
      },
      create: {
        name: cleanName,
        email,
        password: hashedPassword,
        role: 'SALES',
        clusterId: cluster.id,
      },
    });

    console.log(`[USER] Sales: ${cleanName} (${email}) - Week: ${weekType}`);

    // 3. Proses Jadwal Harian & Outlets ke PjpTemplate
    const jadwalHarian = cp.jadwal_harian || {};

    for (const [dayKey, dayData] of Object.entries(jadwalHarian)) {
      const kunjunganList = dayData.kunjungan || [];
      if (kunjunganList.length === 0) continue;

      const targetDayOfWeek = DAY_MAP[dayKey.toLowerCase()] ?? 1;

      // Buat PjpTemplate
      const template = await prisma.pjpTemplate.create({
        data: {
          userId: salesUser.id,
          dayOfWeek: targetDayOfWeek,
          weekType: weekType,
        }
      });
      totalTemplatesCreated++;

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
            clusterId: cluster.id,
          },
          create: {
            outletCode,
            name: k.customer_name || 'Toko Belfoods',
            address: k.address || 'Bandung',
            latitude: Number(k.latitude),
            longitude: Number(k.longitude),
            clusterId: cluster.id,
            outstanding: 0,
            radiusMeters: 50,
          },
        });
        totalOutletsCreated++;

        stopCreateData.push({
          outletId: outlet.id,
          sequence: seq + 1,
        });
      }

      if (stopCreateData.length > 0) {
        // Bulk insert PjpTemplateStop
        await prisma.pjpTemplateStop.createMany({
          data: stopCreateData.map(s => ({
            ...s,
            pjpTemplateId: template.id
          }))
        });
        totalStopsCreated += stopCreateData.length;
      }
    }
  }

  console.log('--------------------------------------------');
  console.log('[SUCCESS] Import (W1/W2) Selesai dengan Sukses!');
  console.log(`Total Outlet Terdaftar (Upserted): ${totalOutletsCreated}`);
  console.log(`Total PJP Template Dibuat: ${totalTemplatesCreated}`);
  console.log(`Total Titik PJP Template Dibuat: ${totalStopsCreated}`);
  console.log('--------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
