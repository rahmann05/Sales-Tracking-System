/**
 * Navigation configuration.
 * Single Responsibility: Central registry of all app navigation tabs,
 * their access-control rules, and display metadata.
 */

import {
    LuLayoutDashboard,
    LuNavigation,
    LuUsers,
    LuShieldCheck,
    LuFileCheck,
    LuBriefcase,
    LuStore,
    LuUserPlus,
    LuClipboardList,
    LuPhoneCall,
    LuTruck,
    LuPackage,
    LuMap,
} from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';
import { LuMapPin } from 'react-icons/lu';
import { 
    ROLES, 
    ROUTE_PLANNING_ROLES, 
    TEAM_TRACKING_ROLES, 
    REPORTS_ROLES, 
    OUTLET_VALIDATION_ROLES,
    OUTLET_REGISTRATION_ROLES,
    OUTLET_APPROVAL_ROLES,
    OUTLET_REGISTRATION_REPORT_ROLES,
    DAILY_CALL_ROLES,
    DELIVERY_MANAGEMENT_ROLES,
    DELIVERY_FIELD_ROLES,
} from './roles';

/** Tab IDs used across the app */
export const TAB_IDS = Object.freeze({
    ROLE_WORKSPACE: 'role-workspace',
    DASHBOARD: 'dashboard',
    DAILY_CALL_MONITOR: 'daily-call-monitor',
    ROUTE_PLANNING: 'route-planning',
    CREATE_CLUSTER: 'create-cluster',
    TEAM_TRACKING: 'team-tracking',
    OUTLET_MANAGEMENT: 'outlet-management',
    OUTLET_REGISTRATION: 'outlet-registration',
    OUTLET_APPROVAL: 'outlet-approval',
    OUTLET_REGISTRATION_REPORT: 'outlet-registration-report',
    REPORTS: 'reports',
    OUTLET_VALIDATION: 'outlet-validation',
    // Delivery Management tabs
    DELIVERY_PACKING_LIST: 'delivery-packing-list',
    DELIVERY_ROUTES: 'delivery-routes',
    DELIVERY_MONITOR: 'delivery-monitor',
    DELIVERY_DRIVER_MAP: 'delivery-driver-map',
});

/** Role-specific "home workspace" tab metadata */
const ROLE_WORKSPACE_MAP = Object.freeze({
    [ROLES.SALES]: { label: 'PJP Sales Field', icon: LuNavigation },
    [ROLES.SUPERVISOR]: { label: 'Supervisi Lapangan', icon: LuShieldCheck },
    [ROLES.ADMIN]: { label: 'Approval Order Admin', icon: LuFileCheck },
    [ROLES.KEPALA_GUDANG]: { label: 'Dashboard Pengiriman', icon: LuTruck },
    [ROLES.SUPIR]: { label: 'Rute Pengiriman Hari Ini', icon: LuTruck },
});

/**
 * Get the role-specific workspace tab for a given role.
 * @param {string} role - User role
 * @returns {{ id: string, label: string, icon: any }}
 */
export const getRoleWorkspaceTab = (role) => {
    const meta = ROLE_WORKSPACE_MAP[role] || { label: 'Workspace', icon: LuNavigation };
    return { id: TAB_IDS.ROLE_WORKSPACE, ...meta };
};

/**
 * Get all navigation tabs available for a given role.
 * @param {string} role - User role
 * @returns {Array<{ id: string, label: string, icon: any }>}
 */
export const getNavigationTabs = (role) => {
    const tabs = [getRoleWorkspaceTab(role)];

    // 1. Rute & RJP Lapangan
    if (ROUTE_PLANNING_ROLES.includes(role)) {
        tabs.push({
            id: TAB_IDS.ROUTE_PLANNING,
            label: role === ROLES.SALES ? 'Jadwal Master RJP' : 'Kelola Master RJP',
            icon: LuNavigation,
        });
    }

    // 2. Registrasi Outlet khusus Sales di Lapangan
    if (role === ROLES.SALES) {
        tabs.push({
            id: TAB_IDS.OUTLET_REGISTRATION,
            label: 'Registrasi Outlet',
            icon: LuUserPlus,
        });
    }

    // 3. Master Outlet untuk Admin & Supervisor
    if ([ROLES.ADMIN, ROLES.SUPERVISOR].includes(role)) {
        tabs.push({
            id: TAB_IDS.OUTLET_MANAGEMENT,
            label: 'Master Outlet',
            icon: LuStore,
        });
    }

    // 4. Persetujuan Outlet NOO untuk Supervisor & Admin
    if (OUTLET_APPROVAL_ROLES.includes(role) && role !== ROLES.SALES) {
        tabs.push({
            id: TAB_IDS.OUTLET_APPROVAL,
            label: 'Persetujuan Outlet',
            icon: LuFileCheck,
        });
    }

    // 5. Tim & Personel
    if (TEAM_TRACKING_ROLES.includes(role)) {
        tabs.push({
            id: TAB_IDS.TEAM_TRACKING,
            label: role === ROLES.SUPERVISOR ? 'Tim & Sales Bawahan' : 'Manajemen Tim & Personel',
            icon: LuUsers,
        });
    }

    // 6. Laporan & Analitik Distribusi ND6
    if (REPORTS_ROLES.includes(role)) {
        tabs.push({ id: TAB_IDS.REPORTS, label: 'Laporan & Analitik', icon: FiBarChart2 });
    }

    // 7. Validasi Titik Koordinat GPS
    if (OUTLET_VALIDATION_ROLES.includes(role)) {
        tabs.push({ id: TAB_IDS.OUTLET_VALIDATION, label: 'Validasi Outlet', icon: LuMapPin });
    }

    // 8. Laporan Registrasi Outlet
    if (OUTLET_REGISTRATION_REPORT_ROLES.includes(role)) {
        tabs.push({
            id: TAB_IDS.OUTLET_REGISTRATION_REPORT,
            label: 'Laporan Registrasi Outlet',
            icon: LuClipboardList,
        });
    }

    // ═══════════════════════════════════════════════════
    // 9. Kepala Gudang — Delivery Management Tabs
    // ═══════════════════════════════════════════════════
    if (DELIVERY_MANAGEMENT_ROLES.includes(role) && role !== ROLES.ADMIN) {
        tabs.push({
            id: TAB_IDS.DELIVERY_PACKING_LIST,
            label: 'Kelola Packing List',
            icon: LuPackage,
        });
        tabs.push({
            id: TAB_IDS.DELIVERY_ROUTES,
            label: 'Kelola Rute Pengiriman',
            icon: LuNavigation,
        });
        tabs.push({
            id: TAB_IDS.DELIVERY_MONITOR,
            label: 'Monitor Pengiriman',
            icon: LuTruck,
        });
    }

    // ═══════════════════════════════════════════════════
    // 10. Supir — Driver Field Tab (Map)
    // ═══════════════════════════════════════════════════
    if (DELIVERY_FIELD_ROLES.includes(role)) {
        tabs.push({
            id: TAB_IDS.DELIVERY_DRIVER_MAP,
            label: 'Peta Pengiriman',
            icon: LuMap,
        });
    }

    // 11. Peta Monitoring Umum (semua role kecuali Supir)
    if (role !== ROLES.SUPIR) {
        tabs.push({ id: TAB_IDS.DASHBOARD, label: 'Peta', icon: LuLayoutDashboard });
    }

    return tabs;
};
