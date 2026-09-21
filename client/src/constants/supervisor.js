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



// Audit compliance checklist definition (label per key)
export const SPV_AUDIT_CHECKLIST_ITEMS = [
    { key: 'stockAvailability', label: 'Ketersediaan Stok Produk Inti (Sembako/Minyak/Beras)' },
    { key: 'priceCompliance', label: 'Kesesuaian Harga Jual & Ketentuan HET' },
    { key: 'posmDisplay', label: 'Pajangan Produk / Banner POSM Terpasang Rapi' },
    { key: 'salesGreeting', label: 'Pelayanan & Hubungan Sales dengan Pemilik Toko Baik' },
];

// Main workspace tabs for SupervisorPage (Action Center & Daily Recap)
export const SUPERVISOR_TABS = [
    { 
        id: 'action_center', 
        label: 'Pusat Approval & Kendala', 
        shortLabel: 'Pusat Approval',
        icon: LuCircleCheck,
        description: 'Antrean persetujuan toko tutup (reroute), buka kunci presensi, dan luar RJP'
    },
    { 
        id: 'daily_recap', 
        label: 'Rekap Harian & Kinerja Tim', 
        shortLabel: 'Rekap & Kinerja',
        icon: LuFileText,
        description: 'Ringkasan pencapaian omzet, target order harian, dan kepatuhan tim sales'
    },
];

// Filter chips untuk tab Pusat Approval & Kendala
export const ACTION_CENTER_FILTERS = [
    { id: 'ALL', label: 'Semua Antrean', icon: null },
    { id: 'CLOSED_SHOP', label: 'Kendala Toko Tutup', icon: FiAlertCircle, badgeColor: 'rose' },
    { id: 'UNLOCK', label: 'Buka Kunci Presensi', icon: LuKey, badgeColor: 'amber' },
    { id: 'OFF_PJP', label: 'Absen Luar RJP', icon: LuClock, badgeColor: 'blue' },
];

export const APPROVAL_SUB_FILTERS = ACTION_CENTER_FILTERS;

export const DEFAULT_SPV_CHECKLIST = {
    stockAvailability: true,
    priceCompliance: true,
    posmDisplay: true,
    salesGreeting: true,
};


