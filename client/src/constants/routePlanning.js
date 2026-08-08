import { LuShieldCheck, LuUsers, LuNavigation, LuMap } from 'react-icons/lu';

/**
 * Route Planning Constants
 * Single Responsibility: Definisi tab per role untuk RoutePlanningPage
 * (dengan label pendek mobile-optimized).
 */

export const RJP_ROLE_TAB_MAP = {
    OPS: [
        { id: 'OPS_MANAGER', shortLabel: 'Master Ops', label: 'Operational Manager (Master Region & Quota)', icon: LuShieldCheck },
        { id: 'SPV_ROLLING', shortLabel: 'Supervisor', label: 'Supervisor (Matriks Rolling)', icon: LuUsers },
        { id: 'SALES_VIEW', shortLabel: 'Pratinjau Sales', label: 'Pratinjau Sales (Rute Harian & TSP)', icon: LuNavigation },
        { id: 'MAP_DIRECTORY', shortLabel: 'Peta & Tim', label: 'Peta Spasial & Direktori Tim', icon: LuMap },
    ],
    SPV: [
        { id: 'SPV_ROLLING', shortLabel: 'Matriks Rolling', label: 'Supervisor (Matriks Rolling Mingguan)', icon: LuUsers },
        { id: 'SALES_VIEW', shortLabel: 'Pratinjau Sales', label: 'Pratinjau Rute Sales Harian & TSP', icon: LuNavigation },
        { id: 'MAP_DIRECTORY', shortLabel: 'Peta & Tim', label: 'Peta Spasial & Direktori Tim', icon: LuMap },
    ],
    SALES: [
        { id: 'SALES_VIEW', shortLabel: 'Rute Saya', label: 'Rute Kunjungan & Jadwal Rolling Saya', icon: LuNavigation },
        { id: 'MAP_DIRECTORY', shortLabel: 'Peta Spasial', label: 'Peta Spasial Rute', icon: LuMap },
    ],
};
