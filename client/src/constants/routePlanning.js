import { LuShieldCheck, LuUsers, LuNavigation } from 'react-icons/lu';

/**
 * Route Planning Constants
 * Single Responsibility: Definisi tab per role untuk RoutePlanningPage
 * (dengan label pendek mobile-optimized).
 */

export const RJP_ROLE_TAB_MAP = {
    SPV: [
        { id: 'MASTER_CLUSTER', shortLabel: 'Master Kluster', label: 'Master Kluster & Alokasi Region RJP', icon: LuShieldCheck },
        { id: 'SPV_ROLLING', shortLabel: 'Matriks Rolling', label: 'Matriks Rolling Mingguan', icon: LuUsers },
        { id: 'SALES_VIEW', shortLabel: 'Pratinjau Sales', label: 'Pratinjau Rute Sales Harian & TSP', icon: LuNavigation },
    ],
    SALES: [
        { id: 'SALES_VIEW', shortLabel: 'Rute Saya', label: 'Rute Kunjungan Hari Ini', icon: LuNavigation },
    ],
};
