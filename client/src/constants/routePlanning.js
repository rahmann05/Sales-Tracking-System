import { LuShieldCheck, LuUsers, LuNavigation } from 'react-icons/lu';

/**
 * Route Planning Constants
 * Single Responsibility: Definisi tab per role untuk RoutePlanningPage
 * (dengan label pendek mobile-optimized).
 */

export const RJP_ROLE_TAB_MAP = {
    SPV: [
        { id: 'MASTER_CLUSTER', shortLabel: '1. Wilayah', label: '1. Wilayah & outlet', icon: LuShieldCheck },
        { id: 'SPV_ROLLING', shortLabel: '2. Template', label: '2. Jadwal mingguan', icon: LuUsers },
        { id: 'SALES_VIEW', shortLabel: '3. PJP harian', label: '3. PJP harian', icon: LuNavigation },
    ],
    SALES: [
        { id: 'SALES_VIEW', shortLabel: 'Rute Saya', label: 'Rute Kunjungan Hari Ini', icon: LuNavigation },
    ],
};
