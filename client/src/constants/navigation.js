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
} from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';
import { LuMapPin } from 'react-icons/lu';
import { ROLES, ROUTE_PLANNING_ROLES, TEAM_TRACKING_ROLES, REPORTS_ROLES, OUTLET_VALIDATION_ROLES } from './roles';

/** Tab IDs used across the app */
export const TAB_IDS = Object.freeze({
    ROLE_WORKSPACE: 'role-workspace',
    DASHBOARD: 'dashboard',
    ROUTE_PLANNING: 'route-planning',
    CREATE_CLUSTER: 'create-cluster',
    TEAM_TRACKING: 'team-tracking',
    OUTLET_MANAGEMENT: 'outlet-management',
    REPORTS: 'reports',
    OUTLET_VALIDATION: 'outlet-validation',
});

/** Role-specific "home workspace" tab metadata */
const ROLE_WORKSPACE_MAP = Object.freeze({
    [ROLES.SALES]: { label: 'PJP Sales Field', icon: LuNavigation },
    [ROLES.SUPERVISOR]: { label: 'Supervisi Lapangan', icon: LuShieldCheck },
    [ROLES.ADMIN]: { label: 'Approval Order Admin', icon: LuFileCheck },
    [ROLES.MANAJER_OPERASIONAL]: { label: 'Persetujuan Rute Ops', icon: LuBriefcase },
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

    tabs.push({ id: TAB_IDS.DASHBOARD, label: 'Peta & Dashboard', icon: LuLayoutDashboard });

    if (ROUTE_PLANNING_ROLES.includes(role)) {
        tabs.push({
            id: TAB_IDS.ROUTE_PLANNING,
            label: role === ROLES.SALES ? 'Jadwal Master RJP' : 'Kelola Master RJP',
            icon: LuNavigation,
        });
    }

    if (TEAM_TRACKING_ROLES.includes(role)) {
        tabs.push({
            id: TAB_IDS.TEAM_TRACKING,
            label: role === ROLES.SALES ? 'Tim & RJP Sales' : 'Tracking Tim Field',
            icon: LuUsers,
        });
    }

    if ([ROLES.MANAJER_OPERASIONAL, ROLES.ADMIN, 'OPERATIONAL_MANAGER'].includes(role)) {
        tabs.push({
            id: TAB_IDS.OUTLET_MANAGEMENT,
            label: 'Master Outlet',
            icon: LuStore,
        });
    }

    if (REPORTS_ROLES.includes(role)) {
        tabs.push({ id: TAB_IDS.REPORTS, label: 'Laporan & Analitik', icon: FiBarChart2 });
    }

    if (OUTLET_VALIDATION_ROLES.includes(role)) {
        tabs.push({ id: TAB_IDS.OUTLET_VALIDATION, label: 'Validasi Outlet', icon: LuMapPin });
    }

    return tabs;
};
