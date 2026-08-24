import { z } from 'zod';

export const createRegistrationSchema = z.object({
  division: z.enum(['UNICHARM', 'BELFOODS', 'GENERAL']).default('UNICHARM'),
  branch: z.string().default('PADALARANG'),
  name: z.string().min(2, 'Nama outlet minimal 2 karakter'),
  ownerName: z.string().optional().nullable(),
  address: z.string().min(3, 'Alamat outlet minimal 3 karakter'),
  address2: z.string().optional().nullable(),
  address3: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  locationType: z.enum(['DALAM_PASAR', 'PINGGIR_JALAN', 'DALAM_GANG', 'KOMPLEK_PERUMAHAN']).default('PINGGIR_JALAN'),
  mappingLocation: z.string().optional().nullable(),

  // Pajak & Legalitas
  taxType: z.enum(['PKP', 'NON_PKP']).default('NON_PKP'),
  taxNumber: z.string().optional().nullable(),
  taxName: z.string().optional().nullable(),
  taxAddress: z.string().optional().nullable(),
  taxDocumentUrl: z.string().optional().nullable(),

  // Wilayah & Geografis
  area: z.enum(['CIMAHI', 'KAB_BANDUNG_BARAT', 'KAB_BANDUNG', 'KOTA_BANDUNG']).default('CIMAHI'),
  subAreaKecamatan: z.string().optional().nullable(),
  kelurahan: z.string().optional().nullable(),
  city: z.string().default('CIMAHI'),
  latitude: z.number().optional().default(0),
  longitude: z.number().optional().default(0),
  photoUrl: z.string().optional().nullable(),

  // Channel & Sub Channel
  channel: z.enum(['MODERN_TRADE', 'GENERAL_TRADE']).default('GENERAL_TRADE'),
  subChannel: z.enum([
    'HYPERMARKET',
    'DRUGSTORE',
    'NAT_SUPERMARKET',
    'LOKAL_SUPERMARKET',
    'CHAIN_MINIMARKET',
    'LOKAL_MINIMARKET',
    'PERKULAKAN',
    'KOPERASI',
    'BIDAN',
    'OUTLET_MOTORIS',
    'APOTIK',
    'GROSIR',
    'TOKO_RETAIL',
    'BABY_SHOP',
  ]).default('TOKO_RETAIL'),
  channelTier: z.enum(['BRONZE_A', 'BRONZE_B', 'BRONZE_C', 'SILVER', 'GOLD']).default('BRONZE_C'),

  // Syarat Pembayaran
  paymentType: z.enum(['CASH', 'TOP', 'TRANSFER']).default('CASH'),
  cashMethod: z.enum(['TUNAI', 'GIRO', 'CEK']).optional().nullable().default('TUNAI'),
  termOfPaymentDays: z.number().int().nonnegative().default(0),
  bankAccountInfo: z.string().optional().nullable(),

  // Rencana Kunjungan
  visitWeekSchedule: z.enum(['WEEK_GANJIL', 'WEEK_GENAP', 'ALL_WEEK']).default('ALL_WEEK'),
  visitDays: z.string().optional().nullable(), // e.g. "SENIN,KAMIS"

  // Mengetahui
  outletKnownBy: z.string().optional().nullable(),
});

export const approveRegistrationSchema = z.object({
  note: z.string().optional().nullable(),
});

export const rejectRegistrationSchema = z.object({
  reason: z.string().min(3, 'Alasan penolakan minimal 3 karakter'),
});

export const finalizeRegistrationSchema = z.object({
  customerCode: z.string().min(2, 'Kode outlet harus diisi'),
  clusterId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const filterRegistrationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20),
  status: z.enum(['ALL', 'DRAFT', 'SUBMITTED', 'SPV_APPROVED', 'OPS_APPROVED', 'REGISTERED_ACTIVE', 'REJECTED']).optional().default('ALL'),
  area: z.enum(['ALL', 'CIMAHI', 'KAB_BANDUNG_BARAT', 'KAB_BANDUNG', 'KOTA_BANDUNG']).optional().default('ALL'),
  channel: z.enum(['ALL', 'MODERN_TRADE', 'GENERAL_TRADE']).optional().default('ALL'),
  division: z.enum(['ALL', 'UNICHARM', 'BELFOODS', 'GENERAL']).optional().default('ALL'),
  search: z.string().optional().default(''),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
