import { prisma } from '../config/prisma.js';

async function seedCustomerRegistrations() {
  console.log('[SEED] Starting CustomerRegistration seeding from PostgreSQL...');

  // Get active sales reps
  const salesUsers = await prisma.user.findMany({
    where: { role: 'SALES', deletedAt: null },
  });

  const spvUser = await prisma.user.findFirst({
    where: { role: 'SUPERVISOR', deletedAt: null },
  });

  const opsUser = await prisma.user.findFirst({
    where: { role: 'MANAJER_OPERASIONAL', deletedAt: null },
  });

  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN', deletedAt: null },
  });

  const sales1 = salesUsers[0] || { id: 'usr-sales-1', name: 'Budi Santoso' };
  const sales2 = salesUsers[1] || { id: 'usr-sales-2', name: 'Siti Rahma' };
  const sales3 = salesUsers[2] || { id: 'usr-sales-3', name: 'Agus Wijaya' };

  const sampleRegistrations = [
    {
      customerCode: 'PVC0011',
      division: 'UNICHARM',
      branch: 'PADALARANG',
      name: 'Toko Berkah Mandiri Sejahtera',
      ownerName: 'H. Suryana',
      address: 'Jl. Raya Gadobangkong No. 88, Kertamulya, Padalarang',
      phone: '081223344556',
      locationType: 'PINGGIR_JALAN',
      mappingLocation: 'Sebelah Bank BRI Gadobangkong, 100 meter dari pertigaan',
      taxType: 'PKP',
      taxNumber: '01.234.567.8-421.000',
      taxName: 'PT BERKAH MANDIRI SEJAHTERA',
      taxAddress: 'Jl. Raya Gadobangkong No. 88, Kertamulya, Kab. Bandung Barat',
      area: 'KAB_BANDUNG_BARAT',
      subAreaKecamatan: 'Padalarang',
      kelurahan: 'Kertamulya',
      city: 'Bandung Barat',
      latitude: -6.8582,
      longitude: 107.5123,
      channel: 'GENERAL_TRADE',
      subChannel: 'GROSIR',
      channelTier: 'BRONZE_A',
      paymentType: 'TOP',
      cashMethod: 'TUNAI',
      termOfPaymentDays: 14,
      visitWeekSchedule: 'ALL_WEEK',
      visitDays: 'SENIN,KAMIS',
      registrationStatus: 'SUBMITTED',
      outletKnownBy: 'H. Suryana (Pemilik)',
      salesmanId: sales1.id,
      salesmanName: sales1.name,
    },
    {
      customerCode: 'PVC0012',
      division: 'UNICHARM',
      branch: 'PADALARANG',
      name: 'Minimarket Barokah Jaya',
      ownerName: 'Ibu Ratna Dewi',
      address: 'Jl. Gandawijaya No. 102, Setiamanah, Cimahi Tengah',
      phone: '081398765432',
      locationType: 'KOMPLEK_PERUMAHAN',
      mappingLocation: 'Depan Lapangan Futsal Setiamanah, cat toko warna hijau kuning',
      taxType: 'NON_PKP',
      taxNumber: '3277015509870002',
      taxName: 'Ratna Dewi',
      taxAddress: 'Jl. Gandawijaya No. 102, Cimahi',
      area: 'CIMAHI',
      subAreaKecamatan: 'Cimahi Tengah',
      kelurahan: 'Setiamanah',
      city: 'Cimahi',
      latitude: -6.8745,
      longitude: 107.5456,
      channel: 'MODERN_TRADE',
      subChannel: 'LOKAL_MINIMARKET',
      channelTier: 'BRONZE_B',
      paymentType: 'CASH',
      cashMethod: 'TUNAI',
      termOfPaymentDays: 0,
      visitWeekSchedule: 'WEEK_GANJIL',
      visitDays: 'SELASA,JUMAT',
      registrationStatus: 'SPV_APPROVED',
      outletKnownBy: 'Ibu Ratna Dewi (Owner)',
      salesmanId: sales2.id,
      salesmanName: sales2.name,
      spvName: spvUser?.name || 'Ahmad Subagja',
      spvApprovedAt: new Date(),
    },
    {
      customerCode: 'PVC0013',
      division: 'UNICHARM',
      branch: 'PADALARANG',
      name: 'Apotik Sehat Farma',
      ownerName: 'Dra. Hj. Nurhayati, Apt.',
      address: 'Jl. Kolonel Masturi No. 45, Cimahi Utara',
      phone: '082111223344',
      locationType: 'PINGGIR_JALAN',
      mappingLocation: 'Ruko 2 lantai samping Klinik Sehat',
      taxType: 'PKP',
      taxNumber: '02.345.678.9-421.000',
      taxName: 'CV SEHAT FARMA UTAMA',
      taxAddress: 'Jl. Kolonel Masturi No. 45, Cimahi',
      area: 'CIMAHI',
      subAreaKecamatan: 'Cimahi Utara',
      kelurahan: 'Cipageran',
      city: 'Cimahi',
      latitude: -6.8621,
      longitude: 107.5389,
      channel: 'GENERAL_TRADE',
      subChannel: 'APOTIK',
      channelTier: 'BRONZE_A',
      paymentType: 'TOP',
      cashMethod: 'TUNAI',
      termOfPaymentDays: 30,
      visitWeekSchedule: 'ALL_WEEK',
      visitDays: 'RABU',
      registrationStatus: 'OPS_APPROVED',
      outletKnownBy: 'Dra. Nurhayati',
      salesmanId: sales3.id,
      salesmanName: sales3.name,
      spvName: spvUser?.name || 'Ahmad Subagja',
      spvApprovedAt: new Date(Date.now() - 86400000),
      opsManagerName: opsUser?.name || 'Bambang Suroso',
      opsApprovedAt: new Date(),
    },
    {
      customerCode: 'PVC0014',
      division: 'UNICHARM',
      branch: 'PADALARANG',
      name: 'Baby Shop Ceria Bunda',
      ownerName: 'Yuliana Tan',
      address: 'Jl. Raya Tagog No. 15, Padalarang',
      phone: '085722334455',
      locationType: 'DALAM_PASAR',
      mappingLocation: 'Blok A No. 12 Pasar Tagog Padalarang',
      taxType: 'NON_PKP',
      taxNumber: '3217014408890001',
      taxName: 'Yuliana Tan',
      taxAddress: 'Jl. Raya Tagog No. 15, Padalarang',
      area: 'KAB_BANDUNG_BARAT',
      subAreaKecamatan: 'Padalarang',
      kelurahan: 'Kertajaya',
      city: 'Bandung Barat',
      latitude: -6.8495,
      longitude: 107.4982,
      channel: 'GENERAL_TRADE',
      subChannel: 'BABY_SHOP',
      channelTier: 'BRONZE_C',
      paymentType: 'CASH',
      cashMethod: 'TUNAI',
      termOfPaymentDays: 0,
      visitWeekSchedule: 'WEEK_GENAP',
      visitDays: 'KAMIS,SABTU',
      registrationStatus: 'REGISTERED_ACTIVE',
      outletKnownBy: 'Yuliana Tan',
      salesmanId: sales1.id,
      salesmanName: sales1.name,
      spvName: spvUser?.name || 'Ahmad Subagja',
      spvApprovedAt: new Date(Date.now() - 172800000),
      opsManagerName: opsUser?.name || 'Bambang Suroso',
      opsApprovedAt: new Date(Date.now() - 86400000),
      adminName: adminUser?.name || 'Maria Ulfah',
      adminRegisteredAt: new Date(),
    },
    {
      customerCode: null,
      division: 'UNICHARM',
      branch: 'PADALARANG',
      name: 'Kios Sembako Makmur',
      ownerName: 'Bpk. Hendra',
      address: 'Jl. Gang H. Syukur No. 4, Leuwigajah',
      phone: '087811223344',
      locationType: 'DALAM_GANG',
      mappingLocation: 'Gang sempit tidak bisa masuk mobil, patokan pos ronda RW 04',
      taxType: 'NON_PKP',
      taxNumber: '3277021105780003',
      taxName: 'Hendra Gunawan',
      taxAddress: 'Jl. Gang H. Syukur No. 4, Cimahi Selatan',
      area: 'CIMAHI',
      subAreaKecamatan: 'Cimahi Selatan',
      kelurahan: 'Leuwigajah',
      city: 'Cimahi',
      latitude: -6.8921,
      longitude: 107.5312,
      channel: 'GENERAL_TRADE',
      subChannel: 'TOKO_RETAIL',
      channelTier: 'BRONZE_C',
      paymentType: 'CASH',
      cashMethod: 'TUNAI',
      termOfPaymentDays: 0,
      visitWeekSchedule: 'ALL_WEEK',
      visitDays: 'SABTU',
      registrationStatus: 'REJECTED',
      rejectionNote: 'Akses jalan tidak memungkinkan untuk pengiriman kendaraan motoris/mobil kanvas, dialihkan ke sub-grosir terdekat.',
      outletKnownBy: 'Bpk. Hendra (Pemilik)',
      salesmanId: sales2.id,
      salesmanName: sales2.name,
    },
  ];

  for (const reg of sampleRegistrations) {
    const existing = await prisma.customerRegistration.findFirst({
      where: { name: reg.name },
    });
    if (!existing) {
      await prisma.customerRegistration.create({ data: reg });
      console.log(`[SEED] Created CustomerRegistration: "${reg.name}" (${reg.registrationStatus})`);
    }
  }

  console.log('[SEED] CustomerRegistration seeding finished successfully!');
}

seedCustomerRegistrations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
