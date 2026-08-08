import { LuUser, LuSparkles, LuClock, LuCompass, LuTrendingUp, LuCircleCheck, LuKey, LuFileText } from 'react-icons/lu';
import { FiAlertCircle } from 'react-icons/fi';

/**
 * Supervisor Domain Constants
 * Single Responsibility: Immutable config for SPV field-visit modes,
 * audit checklist items, and join-visit sales selector options.
 */

export const SPV_MODES = {
    JOINT_VISIT: 'JOINT_VISIT',
    PRIORITY_AUDIT: 'PRIORITY_AUDIT',
    OPENING_INSPECTION: 'OPENING_INSPECTION',
};

export const SPV_MODE_OPTIONS = [
    { id: SPV_MODES.JOINT_VISIT, label: 'Mode Joint Visit (Dampingi Sales)', icon: LuUser },
    { id: SPV_MODES.PRIORITY_AUDIT, label: 'Mode Audit Toko Prioritas', icon: LuSparkles },
    { id: SPV_MODES.OPENING_INSPECTION, label: 'Inspeksi Toko Pembuka (Pagi)', icon: LuClock },
];

export const SPV_SALES_OPTIONS = [
    { value: 'Budi Santoso', label: 'Budi Santoso (Cimahi)' },
    { value: 'Siti Rahma', label: 'Siti Rahma (Padalarang)' },
    { value: 'Agus Wijaya', label: 'Agus Wijaya (Lembang)' },
];

// Audit compliance checklist definition (label per key)
export const SPV_AUDIT_CHECKLIST_ITEMS = [
    { key: 'stockAvailability', label: 'Ketersediaan Stok Produk Inti (Sembako/Minyak/Beras)' },
    { key: 'priceCompliance', label: 'Kesesuaian Harga Jual & Ketentuan HET' },
    { key: 'posmDisplay', label: 'Pajangan Produk / Banner POSM Terpasang Rapi' },
    { key: 'salesGreeting', label: 'Pelayanan & Hubungan Sales dengan Pemilik Toko Baik' },
];

// Main workspace tabs for SupervisorPage
export const SUPERVISOR_TABS = [
    { id: 'field_visit', label: 'Kunjungan & Absensi Lapangan (Utama)', icon: LuCompass },
    { id: 'performance', label: 'Monitoring Tim Sales', icon: LuTrendingUp },
    { id: 'approvals', label: 'Antrean Approval', icon: LuCircleCheck },
    { id: 'incidents', label: 'Laporan Toko Tutup', icon: FiAlertCircle },
];

// Sub-filter chips untuk tab Antrean Approval
export const APPROVAL_SUB_FILTERS = [
    { id: 'ALL', label: 'Semua Antrean', icon: null },
    { id: 'UNLOCK', label: 'Buka Kunci Presensi', icon: LuKey },
    { id: 'OFF_PJP_ATTENDANCE', label: 'Absen Luar RJP', icon: LuClock },
    { id: 'OFF_PJP_REQUEST', label: 'Pengajuan Toko Baru', icon: LuFileText },
];

export const DEFAULT_SPV_CHECKLIST = {
    stockAvailability: true,
    priceCompliance: true,
    posmDisplay: true,
    salesGreeting: true,
};

// Mock: daftar toko Audit Prioritas (Key Account / outlet bermasalah)
export const PRIORITY_AUDIT_STOPS = [
    {
        id: 'spv-audit-1', sequence: 1, outletName: 'Grosir Berkah Jaya Abadi', owner: 'Haji Mansyur',
        phone: '0812-2222-1111', address: 'Jl. Mahar Martanegara No. 45, Leuwigajah, Cimahi',
        currentDistance: 12, radiusMeters: 50, spvVisitType: 'Audit Key Account & Plafon Kredit', assignedSales: 'Budi Santoso',
    },
    {
        id: 'spv-audit-2', sequence: 2, outletName: 'Toko Sumber Rejeki Barokah', owner: 'Ibu Ratna',
        phone: '0813-8888-9999', address: 'Jl. Raya Tagog Padalarang No. 88, KBB',
        currentDistance: 28, radiusMeters: 50, spvVisitType: 'Verifikasi Outlet Baru / Non-Aktif', assignedSales: 'Siti Rahma',
    },
    {
        id: 'spv-audit-3', sequence: 3, outletName: 'Toserba Lembang Asri Mandiri', owner: 'Koh Kevin',
        phone: '0811-7777-6666', address: 'Jl. Raya Lembang No. 120, Lembang',
        currentDistance: 45, radiusMeters: 50, spvVisitType: 'Audit Kepatuhan Display & Promosi', assignedSales: 'Agus Wijaya',
    },
];

// Mock: titik inspeksi pembuka rute per tim
export const OPENING_INSPECTION_TEAMS = [
    { index: 0, fallbackOutlet: 'Toko Sumber Berkah Cimahi', fallbackOwner: 'Pak Haji Ahmad', fallbackAddress: 'Jl. Gandawijaya No. 12, Cimahi', type: 'Inspeksi Pembuka Rute (Tim Cimahi)', sales: 'Budi Santoso', distance: 15 },
    { index: 10, fallbackOutlet: 'Toko Barokah Padalarang', fallbackOwner: 'Ibu Hajah Maryam', fallbackAddress: 'Jl. Raya Tagog No. 45, Padalarang', type: 'Inspeksi Pembuka Rute (Tim Padalarang)', sales: 'Siti Rahma', distance: 32 },
    { index: 20, fallbackOutlet: 'Toserba Mandiri Lembang', fallbackOwner: 'Koh Hendra', fallbackAddress: 'Jl. Raya Lembang No. 88, Lembang', type: 'Inspeksi Pembuka Rute (Tim Lembang)', sales: 'Agus Wijaya', distance: 48 },
];
