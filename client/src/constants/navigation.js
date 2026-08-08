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
} from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';
import { ROLES, ROUTE_PLANNING_ROLES, TEAM_TRACKING_ROLES, REPORTS_ROLES } from './roles';

/** Tab IDs used across the app */
export const TAB_IDS = Object.freeze({
    ROLE_WORKSPACE: 'role-workspace',
    DASHBOARD: 'dashboard',
    ROUTE_PLANNING: 'route-planning',
    TEAM_TRACKING: 'team-tracking',
    REPORTS: 'reports',
});

/** Role-specific "home workspace" tab metadata */
const ROLE_WORKSPACE_MAP = Object.freeze({
    [ROLES.SALES]: { label: 'PJP Sales Field', icon: LuNavigation },
    [ROLES.SUPERVISOR]: { label: 'Supervisi Lapangan', icon: LuShieldCheck },
    [ROLES.ADMIN]: { label: 'Approval Order Admin', icon: LuFileCheck },
    [ROLES.OPERATIONAL_MANAGER]: { label: 'Persetujuan Rute Ops', icon: LuBriefcase },
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

    if (REPORTS_ROLES.includes(role)) {
        tabs.push({ id: TAB_IDS.REPORTS, label: 'Laporan & Analitik', icon: FiBarChart2 });
    }

    return tabs;
};
