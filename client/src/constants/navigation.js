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
    LuLayoutGrid,
    LuSettings,
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
    ADMIN_APPROVAL: 'admin-approval',
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
    SYSTEM_CONFIG: 'system-config',
    USER_MANAGEMENT: 'user-management',
});

/** Role-specific "home workspace" tab metadata */
const ROLE_WORKSPACE_MAP = Object.freeze({
    [ROLES.SALES]: { label: 'PJP Sales Field', icon: LuNavigation },
    [ROLES.SUPERVISOR]: { label: 'Supervisi Lapangan', icon: LuShieldCheck },
    [ROLES.ADMIN]: { label: 'Menu Utama Admin', icon: LuLayoutGrid },
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
export const getNavigationTabs = (userOrRole) => {
    if (!userOrRole) return [];
    const user = typeof userOrRole === 'object' ? userOrRole : { role: userOrRole, permissions: {} };
    const role = user.role;
    const permissions = user.permissions || {};
    
    const tabs = [getRoleWorkspaceTab(role)];

    // 0. Persetujuan Order & Unlock (Admin atau yang punya izin)
    if (role === ROLES.ADMIN || permissions.can_approve_order || permissions.can_unlock_absensi) {
        tabs.push({
            id: TAB_IDS.ADMIN_APPROVAL,
            label: 'Persetujuan Order & Unlock',
            icon: LuFileCheck,
        });
    }

    // 0.1 Daily Call Monitor (Admin, Supervisor, atau yang punya izin)
    if (role === ROLES.ADMIN || DAILY_CALL_ROLES.includes(role) || permissions.can_view_daily_call) {
        tabs.push({
            id: TAB_IDS.DAILY_CALL_MONITOR,
            label: 'Daily Call Monitor',
            icon: LuPhoneCall,
        });
    }

    // 1. Rute & RJP Lapangan
    if (role === ROLES.ADMIN || ROUTE_PLANNING_ROLES.includes(role) || permissions.can_access_rjp || permissions.can_manage_rjp) {
        tabs.push({
            id: TAB_IDS.ROUTE_PLANNING,
            label: role === ROLES.SALES ? 'Jadwal Master RJP' : 'Kelola Master RJP',
            icon: LuNavigation,
        });
    }

    // 2. Registrasi Outlet (Sales di Lapangan atau yang punya izin)
    if (role === ROLES.ADMIN || role === ROLES.SALES || permissions.can_register_outlet) {
        tabs.push({
            id: TAB_IDS.OUTLET_REGISTRATION,
            label: 'Registrasi Outlet',
            icon: LuUserPlus,
        });
    }

    // 3. Master Outlet (Admin, Supervisor, atau yang punya izin)
    if (role === ROLES.ADMIN || [ROLES.ADMIN, ROLES.SUPERVISOR].includes(role) || permissions.can_manage_outlets) {
        tabs.push({
            id: TAB_IDS.OUTLET_MANAGEMENT,
            label: 'Master Outlet',
            icon: LuStore,
        });
    }

    // 4. Persetujuan Outlet NOO (Supervisor, Admin, atau yang punya izin)
    if (role === ROLES.ADMIN || (OUTLET_APPROVAL_ROLES.includes(role) && role !== ROLES.SALES) || permissions.can_approve_outlet) {
        tabs.push({
            id: TAB_IDS.OUTLET_APPROVAL,
            label: 'Persetujuan Outlet',
            icon: LuFileCheck,
        });
    }

    // 5. Tim & Personel
    if (role === ROLES.ADMIN || TEAM_TRACKING_ROLES.includes(role) || permissions.can_view_team || permissions.can_view_live_tracking) {
        tabs.push({
            id: TAB_IDS.TEAM_TRACKING,
            label: role === ROLES.SUPERVISOR ? 'Tim & Sales Bawahan' : 'Manajemen Tim & Personel',
            icon: LuUsers,
        });
    }

    // 6. Laporan & Analitik Distribusi ND6
    if (role === ROLES.ADMIN || REPORTS_ROLES.includes(role) || permissions.can_view_reports) {
        tabs.push({ id: TAB_IDS.REPORTS, label: 'Laporan & Analitik', icon: FiBarChart2 });
    }

    // 7. Validasi Titik Koordinat GPS
    if (role === ROLES.ADMIN || OUTLET_VALIDATION_ROLES.includes(role) || permissions.can_validate_outlet) {
        tabs.push({ id: TAB_IDS.OUTLET_VALIDATION, label: 'Validasi Outlet', icon: LuMapPin });
    }

    // 8. Laporan Registrasi Outlet
    if (role === ROLES.ADMIN || OUTLET_REGISTRATION_REPORT_ROLES.includes(role) || permissions.can_view_outlet_report) {
        tabs.push({
            id: TAB_IDS.OUTLET_REGISTRATION_REPORT,
            label: 'Laporan Registrasi Outlet',
            icon: LuClipboardList,
        });
    }

    // 8b. Kelola Master Kluster
    if (role === ROLES.ADMIN || [ROLES.ADMIN, ROLES.SUPERVISOR].includes(role) || permissions.can_manage_clusters) {
        tabs.push({
            id: TAB_IDS.CREATE_CLUSTER,
            label: 'Kelola Master Kluster',
            icon: LuMap,
        });
    }

    // 9. Kelola Packing List Gudang (Admin, Kepala Gudang, atau yang punya izin)
    if (role === ROLES.ADMIN || DELIVERY_MANAGEMENT_ROLES.includes(role) || permissions.can_manage_delivery || permissions.can_manage_packing_list) {
        tabs.push({
            id: TAB_IDS.DELIVERY_PACKING_LIST,
            label: 'Kelola Packing List',
            icon: LuPackage,
        });
    }

    // 9b. Kelola Rute Pengiriman (Admin, Kepala Gudang, atau yang punya izin)
    if (role === ROLES.ADMIN || DELIVERY_MANAGEMENT_ROLES.includes(role) || permissions.can_manage_delivery || permissions.can_manage_delivery_routes) {
        tabs.push({
            id: TAB_IDS.DELIVERY_ROUTES,
            label: 'Kelola Rute Pengiriman',
            icon: LuNavigation,
        });
    }

    // 9c. Monitor Pengiriman & Logistik (Admin, Kepala Gudang, atau yang punya izin)
    if (role === ROLES.ADMIN || DELIVERY_MANAGEMENT_ROLES.includes(role) || permissions.can_manage_delivery || permissions.can_monitor_delivery) {
        tabs.push({
            id: TAB_IDS.DELIVERY_MONITOR,
            label: 'Monitor Pengiriman',
            icon: LuTruck,
        });
    }

    // 10. Supir — Driver Field Tab (Map)
    if (DELIVERY_FIELD_ROLES.includes(role) || permissions.can_access_driver_map) {
        tabs.push({
            id: TAB_IDS.DELIVERY_DRIVER_MAP,
            label: 'Peta Pengiriman',
            icon: LuMap,
        });
    }

    // 11. Pengaturan Sistem & Manajemen User (Admin atau yang punya izin)
    if (role === ROLES.ADMIN || permissions.can_manage_system_config) {
        tabs.push({
            id: TAB_IDS.SYSTEM_CONFIG,
            label: 'Pengaturan Sistem',
            icon: LuSettings,
        });
    }
    if (role === ROLES.ADMIN || permissions.can_manage_users || permissions.can_manage_roles) {
        tabs.push({
            id: TAB_IDS.USER_MANAGEMENT,
            label: 'Manajemen Pengguna',
            icon: LuUsers,
        });
    }

    // 12. Peta Monitoring Umum (Semua kecuali supir murni)
    if (role === ROLES.ADMIN || role !== ROLES.SUPIR || permissions.can_view_dashboard) {
        tabs.push({ id: TAB_IDS.DASHBOARD, label: 'Peta', icon: LuLayoutDashboard });
    }

    return tabs;
};
