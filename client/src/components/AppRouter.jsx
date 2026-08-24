import React from 'react';
import { useApp } from '../context/AppContext';
import { AccessDenied } from './common/AccessDenied';
import { TAB_IDS } from '../constants/navigation';
import {
    ROUTE_PLANNING_ROLES,
    TEAM_TRACKING_ROLES,
    REPORTS_ROLES,
    OUTLET_VALIDATION_ROLES,
    ROLES,
} from '../constants/roles';

import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { RoutePlanningPage } from '../pages/RoutePlanning/RoutePlanningPage';
import { CreateClusterPage } from '../pages/RoutePlanning/CreateClusterPage';
import { TeamTrackingPage } from '../pages/TeamTracking/TeamTrackingPage';
import { ReportsPage } from '../pages/Reports/ReportsPage';
import { SalesPage } from '../pages/Sales/SalesPage';
import { SupervisorPage } from '../pages/Supervisor/SupervisorPage';
import { AdminApprovalPage } from '../pages/Admin/AdminApprovalPage';
import { OpsManagerPage } from '../pages/OpsManager/OpsManagerPage';
import { OutletValidationPage } from '../pages/OpsManager/OutletValidationPage';
import { OutletManagementPage } from '../pages/OutletManagement/OutletManagementPage';
import { OutletRegistrationPage } from '../pages/OutletRegistration/OutletRegistrationPage';
import { OutletApprovalPage } from '../pages/OutletApproval/OutletApprovalPage';
import { OutletRegistrationReportPage } from '../pages/OutletRegistrationReport/OutletRegistrationReportPage';
import { 
    OUTLET_REGISTRATION_ROLES,
    OUTLET_APPROVAL_ROLES,
    OUTLET_REGISTRATION_REPORT_ROLES 
} from '../constants/roles';

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
        case ROLES.MANAJER_OPERASIONAL:
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
    [TAB_IDS.OUTLET_REGISTRATION]: {
        roles: OUTLET_REGISTRATION_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Halaman Registrasi Outlet hanya dapat diakses oleh Salesman dan manajemen.',
    },
    [TAB_IDS.OUTLET_APPROVAL]: {
        roles: OUTLET_APPROVAL_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Halaman Persetujuan Outlet hanya dapat diakses oleh Supervisor dan Manajer Operasional.',
    },
    [TAB_IDS.OUTLET_REGISTRATION_REPORT]: {
        roles: OUTLET_REGISTRATION_REPORT_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Halaman Laporan Registrasi Outlet hanya dapat diakses oleh Admin dan Manajer Operasional.',
    },
    [TAB_IDS.TEAM_TRACKING]: {
        roles: TEAM_TRACKING_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Halaman Tim dan RJP hanya dapat diakses oleh pengguna terdaftar.',
    },
    [TAB_IDS.OUTLET_MANAGEMENT]: {
        roles: ['ADMIN', 'MANAJER_OPERASIONAL', 'OPERATIONAL_MANAGER'],
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Halaman Kelola Master Outlet hanya dapat diakses oleh Manajer Operasional atau Admin.',
    },
    [TAB_IDS.REPORTS]: {
        roles: REPORTS_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description:
            'Halaman Laporan dan Analitik hanya dapat diakses oleh Manajemen, Admin, dan Supervisor.',
    },
    [TAB_IDS.OUTLET_VALIDATION]: {
        roles: OUTLET_VALIDATION_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Fitur Validasi Outlet hanya dapat diakses oleh Manajer Operasional.',
    },
    [TAB_IDS.CREATE_CLUSTER]: {
        roles: ['ADMIN', 'MANAJER_OPERASIONAL'],
        title: 'Akses Dibatasi (Access Denied)',
        description:
            'Hanya Admin atau Manajer Operasional yang dapat membuat cluster baru.',
    },
};

/** Wrapper: full interactive layer (blocks map clicks) */
const Interactive = ({ children }) => <div className="w-full h-full pointer-events-auto">{children}</div>;

/** Wrapper: transparent overlay that lets map clicks through */
const MapOverlay = ({ children }) => <div className="w-full h-full pointer-events-none">{children}</div>;

/**
 * AppRouter Component
 * Single Responsibility: Route the activeTab to the correct page component
 * with built-in Role-Based Access Control (RBAC).
 */
export const AppRouter = ({ activeTab, searchQuery, onGoBack, mapState, setMapState, setMapHandlers }) => {
    const { user } = useApp();
    const role = user?.role;

    // Role workspace (home)
    if (activeTab === TAB_IDS.ROLE_WORKSPACE) {
        return <Interactive><RoleWorkspace role={role} /></Interactive>;
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
            return <MapOverlay><DashboardPage searchQuery={searchQuery} /></MapOverlay>;
        case TAB_IDS.OUTLET_REGISTRATION:
            return <Interactive><OutletRegistrationPage /></Interactive>;
        case TAB_IDS.OUTLET_APPROVAL:
            return <Interactive><OutletApprovalPage /></Interactive>;
        case TAB_IDS.OUTLET_REGISTRATION_REPORT:
            return <Interactive><OutletRegistrationReportPage /></Interactive>;
        case TAB_IDS.ROUTE_PLANNING:
            return <Interactive><RoutePlanningPage searchQuery={searchQuery} /></Interactive>;
        case TAB_IDS.CREATE_CLUSTER:
            // Map spacer (left) is transparent, but control panel (right) must be clickable
            return <Interactive><CreateClusterPage onGoBack={onGoBack} /></Interactive>;
        case TAB_IDS.TEAM_TRACKING:
            return <Interactive><TeamTrackingPage searchQuery={searchQuery} /></Interactive>;
        case TAB_IDS.OUTLET_MANAGEMENT:
            return <Interactive><OutletManagementPage searchQuery={searchQuery} /></Interactive>;
        case TAB_IDS.REPORTS:
            return <Interactive><ReportsPage searchQuery={searchQuery} /></Interactive>;
        case TAB_IDS.OUTLET_VALIDATION:
            return <Interactive><OutletValidationPage /></Interactive>;
        default:
            return <MapOverlay><DashboardPage searchQuery={searchQuery} /></MapOverlay>;
    }
};
