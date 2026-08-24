import { prisma } from '../config/prisma.js';

async function seedBelfoodsConfig() {
  console.log('[SEED] Seeding ACTIVE_DIVISION to BELFOODS in PostgreSQL SystemConfig...');

  // 1. Upsert ACTIVE_DIVISION = 'BELFOODS'
  await prisma.systemConfig.upsert({
    where: { key: 'ACTIVE_DIVISION' },
    update: { value: 'BELFOODS' },
    create: {
      key: 'ACTIVE_DIVISION',
      value: 'BELFOODS',
    },
  });

  // 2. Fetch sales reps
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

  // 3. Clear and re-populate registrations strictly for BELFOODS (BFI)
  await prisma.customerRegistration.deleteMany({});

  const belfoodsRegistrations = [
    {
      customerCode: 'BFI0001',
      division: 'BELFOODS',
      branch: 'PADALARANG',
      name: 'Toko Frozen Food Berkah Jaya',
      ownerName: 'Bpk. Suryana',
      address: 'Jl. Raya Gadobangkong No. 88, Kertamulya, Padalarang',
      phone: '081223344556',
      locationType: 'PINGGIR_JALAN',
      mappingLocation: 'Sebelah Bank BRI Gadobangkong, Ruko Freezer Belfoods',
      taxType: 'PKP',
      taxNumber: '01.234.567.8-421.000',
      taxName: 'PT BERKAH FROZEN SEJAHTERA',
      taxAddress: 'Jl. Raya Gadobangkong No. 88, Kab. Bandung Barat',
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
      outletKnownBy: 'Bpk. Suryana (Owner)',
      salesmanId: sales1.id,
      salesmanName: sales1.name,
      photoId: 'PHOTO-REG-20260824-A109F2',
      photoUrl: '/uploads/outlet-photos/PHOTO-REG-20260824-A109F2.jpg',
      placeId: 'ChIJOTALLA_Padalarang_01',
      placeDetails: {
        name: 'OTALLA',
        rating: 5.0,
        userRatingsTotal: 1,
        categoryName: 'Toko makanan beku',
        address: 'PERUM LAKSNAMEKAR ASRI No.10 A BLOK A, RT.01/RW.09, Laksanamekar, Kec. Padalarang, Bandung, Jawa Barat 40553',
        openNow: true,
        openingHoursText: 'Buka · Tutup pukul 22.00',
        phone: '0838-2217-0889',
        plusCode: '4F7R+X3 Laksanamekar, Kabupaten Bandung Barat',
        deliveryInfo: ['Ambil di toko', 'Pesan antar'],
        photoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.8582,107.5123',
      },
    },
    {
      customerCode: 'BFI0002',
      division: 'BELFOODS',
      branch: 'PADALARANG',
      name: 'Minimarket Olahan Unggas Barokah',
      ownerName: 'Ibu Ratna Dewi',
      address: 'Jl. Gandawijaya No. 102, Setiamanah, Cimahi Tengah',
      phone: '081398765432',
      locationType: 'KOMPLEK_PERUMAHAN',
      mappingLocation: 'Depan Lapangan Futsal Setiamanah, Freezer Belfoods Nugget & Sosis',
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
      registrationStatus: 'REGISTERED_ACTIVE',
      outletKnownBy: 'Ibu Ratna Dewi',
      salesmanId: sales1.id,
      salesmanName: sales1.name,
      photoId: 'PHOTO-REG-20260824-B8712C',
      photoUrl: '/uploads/outlet-photos/PHOTO-REG-20260824-B8712C.jpg',
      placeId: 'ChIJBarokah_Cimahi_02',
      placeDetails: {
        name: 'Minimarket Olahan Unggas Barokah',
        rating: 4.8,
        userRatingsTotal: 12,
        categoryName: 'Minimarket & Toko Sembako',
        address: 'Jl. Gandawijaya No. 102, Setiamanah, Cimahi Tengah, Kota Cimahi, Jawa Barat 40524',
        openNow: true,
        openingHoursText: 'Buka · Tutup pukul 21.30',
        phone: '0813-9876-5432',
        plusCode: '4F8W+78 Setiamanah, Kota Cimahi',
        deliveryInfo: ['Ambil di toko'],
        photoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.8745,107.5456',
      },
      spvName: spvUser?.name || 'Ahmad Subagja',
      spvApprovedAt: new Date(Date.now() - 172800000),
      opsManagerName: opsUser?.name || 'Bambang Suroso',
      opsApprovedAt: new Date(Date.now() - 86400000),
      adminName: adminUser?.name || 'Maria Ulfah',
      adminRegisteredAt: new Date(),
    },
    {
      customerCode: 'BFI0003',
      division: 'BELFOODS',
      branch: 'PADALARANG',
      name: 'Pusat Nugget & Sosis Cimahi Sehat',
      ownerName: 'Dra. Hj. Nurhayati',
      address: 'Jl. Kolonel Masturi No. 45, Cimahi Utara',
      phone: '082111223344',
      locationType: 'PINGGIR_JALAN',
      mappingLocation: 'Ruko 2 lantai samping Klinik Sehat, Chiller Belfoods',
      taxType: 'PKP',
      taxNumber: '02.345.678.9-421.000',
      taxName: 'CV CIMAHI FROZEN FOOD UTAMA',
      taxAddress: 'Jl. Kolonel Masturi No. 45, Cimahi',
      area: 'CIMAHI',
      subAreaKecamatan: 'Cimahi Utara',
      kelurahan: 'Cipageran',
      city: 'Cimahi',
      latitude: -6.8621,
      longitude: 107.5389,
      channel: 'GENERAL_TRADE',
      subChannel: 'TOKO_RETAIL',
      channelTier: 'BRONZE_A',
      paymentType: 'TOP',
      cashMethod: 'TUNAI',
      termOfPaymentDays: 30,
      visitWeekSchedule: 'ALL_WEEK',
      visitDays: 'RABU',
      registrationStatus: 'SPV_APPROVED',
      outletKnownBy: 'Dra. Nurhayati',
      salesmanId: sales2.id,
      salesmanName: sales2.name,
      photoId: 'PHOTO-REG-20260824-C9914E',
      photoUrl: '/uploads/outlet-photos/PHOTO-REG-20260824-C9914E.jpg',
      placeId: 'ChIJCimahiSehat_03',
      placeDetails: {
        name: 'Pusat Nugget & Sosis Cimahi Sehat',
        rating: 4.9,
        userRatingsTotal: 28,
        categoryName: 'Grosir Frozen Food & Sosis',
        address: 'Jl. Kolonel Masturi No. 45, Cipageran, Cimahi Utara, Kota Cimahi, Jawa Barat 40511',
        openNow: true,
        openingHoursText: 'Buka · Tutup pukul 21.00',
        phone: '0821-1122-3344',
        plusCode: '4F9Q+4M Cipageran, Kota Cimahi',
        deliveryInfo: ['Ambil di toko', 'Pesan antar'],
        photoUrl: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&auto=format&fit=crop&q=80',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-6.8621,107.5389',
      },
      spvName: spvUser?.name || 'Ahmad Subagja',
      spvApprovedAt: new Date(),
    },
  ];

  for (const reg of belfoodsRegistrations) {
    await prisma.customerRegistration.create({ data: reg });
    console.log(`[SEED] Created CustomerRegistration: "${reg.name}" for ${reg.salesmanName} (${reg.division})`);
  }

  console.log('[SEED] Belfoods config & registrations seeded successfully!');
}

seedBelfoodsConfig()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
