import React from 'react';
import { useApp } from '../context/AppContext';
import { AccessDenied } from './common/AccessDenied';
import { TAB_IDS } from '../constants/navigation';
import {
    ROUTE_PLANNING_ROLES,
    TEAM_TRACKING_ROLES,
    REPORTS_ROLES,
    ROLES,
} from '../constants/roles';

import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { RoutePlanningPage } from '../pages/RoutePlanning/RoutePlanningPage';
import { TeamTrackingPage } from '../pages/TeamTracking/TeamTrackingPage';
import { ReportsPage } from '../pages/Reports/ReportsPage';
import { SalesPage } from '../pages/Sales/SalesPage';
import { SupervisorPage } from '../pages/Supervisor/SupervisorPage';
import { AdminApprovalPage } from '../pages/Admin/AdminApprovalPage';
import { OpsManagerPage } from '../pages/OpsManager/OpsManagerPage';

/**
 * RoleWorkspace Component
 * Single Responsibility: Render the role-specific home workspace page.
 */
const RoleWorkspace = ({ role }) => {
    switch (role) {
        case ROLES.SALES:
            return <SalesPage />;
        case ROLES.SUPERVISOR:
            return <SupervisorPage />;
        case ROLES.ADMIN:
            return <AdminApprovalPage />;
        case ROLES.OPERATIONAL_MANAGER:
            return <OpsManagerPage />;
        default:
            return <SalesPage />;
    }
};

/**
 * AccessControlMap
 * Single Responsibility: Define which tab requires which roles + denial message.
 */
const ACCESS_CONTROL = {
    [TAB_IDS.ROUTE_PLANNING]: {
        roles: ROUTE_PLANNING_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description:
            'Halaman Jadwal Master RJP hanya dapat diakses oleh Sales Field, Supervisor, dan Manajer Operasional.',
    },
    [TAB_IDS.TEAM_TRACKING]: {
        roles: TEAM_TRACKING_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Halaman Tim dan RJP hanya dapat diakses oleh pengguna terdaftar.',
    },
    [TAB_IDS.REPORTS]: {
        roles: REPORTS_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description:
            'Fitur Laporan hanya dapat diakses oleh Supervisor, Manajer Operasional, atau Admin Penjualan.',
    },
};

/**
 * AppRouter Component
 * Single Responsibility: Route the activeTab to the correct page component
 * with built-in Role-Based Access Control (RBAC).
 */
export const AppRouter = ({ activeTab, searchQuery, onGoBack }) => {
    const { user } = useApp();
    const role = user?.role;

    // Role workspace (home)
    if (activeTab === TAB_IDS.ROLE_WORKSPACE) {
        return <RoleWorkspace role={role} />;
    }

    // Check RBAC for restricted tabs
    const accessRule = ACCESS_CONTROL[activeTab];
    if (accessRule && !accessRule.roles.includes(role)) {
        return (
            <AccessDenied
                title={accessRule.title}
                description={accessRule.description}
                onGoBack={onGoBack}
            />
        );
    }

    // Public tab routing
    switch (activeTab) {
        case TAB_IDS.DASHBOARD:
            return <DashboardPage searchQuery={searchQuery} />;
        case TAB_IDS.ROUTE_PLANNING:
            return <RoutePlanningPage searchQuery={searchQuery} />;
        case TAB_IDS.TEAM_TRACKING:
            return <TeamTrackingPage searchQuery={searchQuery} />;
        case TAB_IDS.REPORTS:
            return <ReportsPage searchQuery={searchQuery} />;
        default:
            return <DashboardPage searchQuery={searchQuery} />;
    }
};
