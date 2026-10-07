import React, { Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { AccessDenied } from '../shared/components/common/AccessDenied';
import { TAB_IDS, isTabPermissionAllowed } from '../constants/navigation';
import {
    ROUTE_PLANNING_ROLES,
    TEAM_TRACKING_ROLES,
    REPORTS_ROLES,
    OUTLET_VALIDATION_ROLES,
    ROLES,
    OUTLET_REGISTRATION_ROLES,
    OUTLET_APPROVAL_ROLES,
    OUTLET_REGISTRATION_REPORT_ROLES,
    DAILY_CALL_ROLES,
    DELIVERY_MANAGEMENT_ROLES,
    DELIVERY_FIELD_ROLES,
} from '../constants/roles';

// Helper for route-level code splitting (Google Web Vitals Best Practice)
const lazyNamed = (factory, name) =>
    React.lazy(() => factory().then((mod) => ({ default: mod[name] })));

const DashboardPage = lazyNamed(() => import('../pages/Dashboard/DashboardPage'), 'DashboardPage');
const RoutePlanningPage = lazyNamed(() => import('../pages/RoutePlanning/RoutePlanningPage'), 'RoutePlanningPage');
const CreateClusterPage = lazyNamed(() => import('../pages/RoutePlanning/CreateClusterPage'), 'CreateClusterPage');
const TeamTrackingPage = lazyNamed(() => import('../pages/TeamTracking/TeamTrackingPage'), 'TeamTrackingPage');
const ReportsPage = lazyNamed(() => import('../pages/Reports/ReportsPage'), 'ReportsPage');
const SalesPage = lazyNamed(() => import('../pages/Sales/SalesPage'), 'SalesPage');
const SupervisorPage = lazyNamed(() => import('../pages/Supervisor/SupervisorPage'), 'SupervisorPage');
const AdminApprovalPage = lazyNamed(() => import('../pages/Admin/AdminApprovalPage'), 'AdminApprovalPage');
const AdminLandingPage = lazyNamed(() => import('../pages/Admin/AdminLandingPage'), 'AdminLandingPage');
const AdminConfigPage = lazyNamed(() => import('../pages/Admin/AdminConfigPage'), 'AdminConfigPage');
const AdminUserListPage = lazyNamed(() => import('../pages/Admin/AdminUserListPage'), 'AdminUserListPage');
const OutletValidationPage = lazyNamed(() => import('../pages/OutletValidation/OutletValidationPage'), 'OutletValidationPage');
const OutletManagementPage = lazyNamed(() => import('../pages/OutletManagement/OutletManagementPage'), 'OutletManagementPage');
const OutletRegistrationPage = lazyNamed(() => import('../pages/OutletRegistration/OutletRegistrationPage'), 'OutletRegistrationPage');
const OutletApprovalPage = lazyNamed(() => import('../pages/OutletApproval/OutletApprovalPage'), 'OutletApprovalPage');
const OutletRegistrationReportPage = lazyNamed(() => import('../pages/OutletRegistrationReport/OutletRegistrationReportPage'), 'OutletRegistrationReportPage');
const DailyCallMonitorPage = lazyNamed(() => import('../pages/DailyCallMonitor/DailyCallMonitorPage'), 'DailyCallMonitorPage');

// Delivery Management Pages
const WarehousePage = lazyNamed(() => import('../pages/Warehouse/WarehousePage'), 'WarehousePage');
const DriverPage = lazyNamed(() => import('../pages/Driver/DriverPage'), 'DriverPage');
const PackingListManager = lazyNamed(() => import('../pages/Warehouse/components/PackingListManager'), 'PackingListManager');
const DeliveryRouteBuilder = lazyNamed(() => import('../pages/Warehouse/components/DeliveryRouteBuilder'), 'DeliveryRouteBuilder');
const DeliveryMonitor = lazyNamed(() => import('../pages/Warehouse/components/DeliveryMonitor'), 'DeliveryMonitor');
const DriverRouteMap = lazyNamed(() => import('../pages/Driver/components/DriverRouteMap'), 'DriverRouteMap');

const PageLoading = () => (
    <div className="flex items-center justify-center min-h-[350px] w-full">
        <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-neutral-500 font-sans">Memuat modul...</span>
        </div>
    </div>
);

/**
 * RoleWorkspace Component
 * Single Responsibility: Render the role-specific home workspace page.
 */
const RoleWorkspace = ({ role }) => {
    let content;
    switch (role) {
        case ROLES.SALES:
            content = <SalesPage />;
            break;
        case ROLES.SUPERVISOR:
            content = <SupervisorPage />;
            break;
        case ROLES.ADMIN:
            content = <AdminLandingPage />;
            break;
        case ROLES.KEPALA_GUDANG:
            content = <WarehousePage />;
            break;
        case ROLES.SUPIR:
            content = <DriverPage />;
            break;
        default:
            content = <SalesPage />;
            break;
    }
    return <Suspense fallback={<PageLoading />}>{content}</Suspense>;
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
            'Halaman Jadwal Master RJP hanya dapat diakses oleh Sales Field, Supervisor, dan Admin.',
    },
    [TAB_IDS.OUTLET_REGISTRATION]: {
        roles: OUTLET_REGISTRATION_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Halaman Registrasi Outlet hanya dapat diakses oleh Salesman dan manajemen.',
    },
    [TAB_IDS.OUTLET_APPROVAL]: {
        roles: OUTLET_APPROVAL_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Halaman Persetujuan Outlet hanya dapat diakses oleh Supervisor dan Admin.',
    },
    [TAB_IDS.OUTLET_REGISTRATION_REPORT]: {
        roles: OUTLET_REGISTRATION_REPORT_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Halaman Laporan Registrasi Outlet hanya dapat diakses oleh Supervisor dan Admin.',
    },
    [TAB_IDS.DAILY_CALL_MONITOR]: {
        roles: DAILY_CALL_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Halaman Daily Call Monitor hanya dapat diakses oleh Admin dan Supervisor.',
    },
    [TAB_IDS.TEAM_TRACKING]: {
        roles: TEAM_TRACKING_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Halaman Tim dan RJP hanya dapat diakses oleh pengguna terdaftar.',
    },
    [TAB_IDS.OUTLET_MANAGEMENT]: {
        roles: ['ADMIN', 'SUPERVISOR'],
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Halaman Kelola Master Outlet hanya dapat diakses oleh Supervisor atau Admin.',
    },
    [TAB_IDS.REPORTS]: {
        roles: REPORTS_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description:
            'Halaman Laporan dan Analitik hanya dapat diakses oleh Admin dan Supervisor.',
    },
    [TAB_IDS.OUTLET_VALIDATION]: {
        roles: OUTLET_VALIDATION_ROLES,
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Fitur Validasi Outlet dapat diakses oleh Supervisor dan Admin.',
    },
    [TAB_IDS.MASTER_CLUSTERS]: {roles: ['ADMIN', 'SUPERVISOR'], title: 'Akses dibatasi', description: 'Pengelolaan kluster memerlukan izin pengelolaan wilayah.'},
    [TAB_IDS.CREATE_CLUSTER]: {
        roles: ['ADMIN', 'SUPERVISOR'],
        title: 'Akses Dibatasi (Access Denied)',
        description:
            'Hanya Admin atau Supervisor yang dapat membuat cluster baru.',
    },
    // Delivery Management Access Control
    [TAB_IDS.DELIVERY_PACKING_LIST]: {
        roles: [...DELIVERY_MANAGEMENT_ROLES],
        title: 'Akses Dibatasi',
        description: 'Halaman Packing List hanya dapat diakses oleh Kepala Gudang.',
    },
    [TAB_IDS.DELIVERY_ROUTES]: {
        roles: [...DELIVERY_MANAGEMENT_ROLES],
        title: 'Akses Dibatasi',
        description: 'Halaman Rute Pengiriman hanya dapat diakses oleh Kepala Gudang.',
    },
    [TAB_IDS.DELIVERY_MONITOR]: {
        roles: [...DELIVERY_MANAGEMENT_ROLES],
        title: 'Akses Dibatasi',
        description: 'Halaman Monitor Pengiriman hanya dapat diakses oleh Kepala Gudang.',
    },
    [TAB_IDS.DELIVERY_DRIVER_MAP]: {
        roles: [...DELIVERY_FIELD_ROLES],
        title: 'Akses Dibatasi',
        description: 'Halaman Peta Pengiriman hanya dapat diakses oleh Supir.',
    },
    [TAB_IDS.ADMIN_APPROVAL]: {
        roles: [ROLES.ADMIN],
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Halaman Persetujuan Order dan Buka Kunci hanya dapat diakses oleh Admin.',
    },
    [TAB_IDS.SYSTEM_CONFIG]: {
        roles: [ROLES.ADMIN],
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Halaman Pengaturan Sistem hanya dapat diakses oleh Admin.',
    },
    [TAB_IDS.USER_MANAGEMENT]: {
        roles: [ROLES.ADMIN],
        title: 'Akses Dibatasi (Access Denied)',
        description: 'Halaman Manajemen Pengguna hanya dapat diakses oleh Admin.',
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
export const AppRouter = ({ activeTab, onGoBack, mapState, setMapState, setMapHandlers }) => {
    const { user } = useApp();
    const role = user?.role;
    const permissions = user?.permissions || {};

    // Role workspace (home)
    if (activeTab === TAB_IDS.ROLE_WORKSPACE) {
        return <Interactive><RoleWorkspace role={role} onGoBack={onGoBack} /></Interactive>;
    }

    // Check RBAC for restricted tabs
    const accessRule = ACCESS_CONTROL[activeTab];
    let hasAccess = false;
    
    if (accessRule) {
        if (role === ROLES.ADMIN || accessRule.roles.includes(role)) {
            hasAccess = true;
        } else {
            // Check granular permissions bypass
            if (activeTab === TAB_IDS.ADMIN_APPROVAL && (permissions.can_approve_order || permissions.can_unlock_absensi)) hasAccess = true;
            if (activeTab === TAB_IDS.DAILY_CALL_MONITOR && permissions.can_view_daily_call) hasAccess = true;
            if (activeTab === TAB_IDS.ROUTE_PLANNING && (permissions.can_access_rjp || permissions.can_manage_rjp)) hasAccess = true;
            if (activeTab === TAB_IDS.OUTLET_REGISTRATION && permissions.can_register_outlet) hasAccess = true;
            if (activeTab === TAB_IDS.OUTLET_MANAGEMENT && permissions.can_manage_outlets) hasAccess = true;
            if (activeTab === TAB_IDS.OUTLET_APPROVAL && permissions.can_approve_outlet) hasAccess = true;
            if (activeTab === TAB_IDS.OUTLET_REGISTRATION_REPORT && permissions.can_view_outlet_report) hasAccess = true;
            if (activeTab === TAB_IDS.TEAM_TRACKING && (permissions.can_view_team || permissions.can_view_live_tracking)) hasAccess = true;
            if (activeTab === TAB_IDS.REPORTS && permissions.can_view_reports) hasAccess = true;
            if (activeTab === TAB_IDS.OUTLET_VALIDATION && permissions.can_validate_outlet) hasAccess = true;
            if ([TAB_IDS.CREATE_CLUSTER, TAB_IDS.MASTER_CLUSTERS].includes(activeTab) && permissions.can_manage_clusters) hasAccess = true;
            if (activeTab === TAB_IDS.DELIVERY_PACKING_LIST && (permissions.can_manage_delivery || permissions.can_manage_packing_list)) hasAccess = true;
            if (activeTab === TAB_IDS.DELIVERY_ROUTES && (permissions.can_manage_delivery || permissions.can_manage_delivery_routes)) hasAccess = true;
            if (activeTab === TAB_IDS.DELIVERY_MONITOR && (permissions.can_manage_delivery || permissions.can_monitor_delivery)) hasAccess = true;
            if (activeTab === TAB_IDS.DELIVERY_DRIVER_MAP && permissions.can_access_driver_map) hasAccess = true;
            if (activeTab === TAB_IDS.SYSTEM_CONFIG && permissions.can_manage_system_config) hasAccess = true;
            if (activeTab === TAB_IDS.USER_MANAGEMENT && (permissions.can_manage_users || permissions.can_manage_roles)) hasAccess = true;
        }
    } else {
        hasAccess = true; // No rule = public
    }

    hasAccess = hasAccess && isTabPermissionAllowed(activeTab,user);
    if (!hasAccess) {
        return (
            <AccessDenied
                title={accessRule.title}
                description={accessRule.description}
                onGoBack={onGoBack}
            />
        );
    }

    // Public tab routing with Suspense code splitting
    let tabContent;
    switch (activeTab) {
        case TAB_IDS.ADMIN_APPROVAL:
            tabContent = <Interactive><AdminApprovalPage onGoBack={onGoBack} /></Interactive>;
            break;
        case TAB_IDS.DASHBOARD:
            tabContent = <MapOverlay><DashboardPage /></MapOverlay>;
            break;
        case TAB_IDS.DAILY_CALL_MONITOR:
            tabContent = <Interactive><DailyCallMonitorPage /></Interactive>;
            break;
        case TAB_IDS.OUTLET_REGISTRATION:
            tabContent = <Interactive><OutletRegistrationPage /></Interactive>;
            break;
        case TAB_IDS.OUTLET_APPROVAL:
            tabContent = <Interactive><OutletApprovalPage /></Interactive>;
            break;
        case TAB_IDS.OUTLET_REGISTRATION_REPORT:
            tabContent = <Interactive><OutletRegistrationReportPage /></Interactive>;
            break;
        case TAB_IDS.ROUTE_PLANNING:
            tabContent = <Interactive><RoutePlanningPage /></Interactive>;
            break;
        case TAB_IDS.MASTER_CLUSTERS:
            tabContent = <Interactive><RoutePlanningPage /></Interactive>;
            break;
        case TAB_IDS.CREATE_CLUSTER:
            // Map spacer (left) is transparent, but control panel (right) must be clickable
            tabContent = <MapOverlay><CreateClusterPage /></MapOverlay>;
            break;
        case TAB_IDS.TEAM_TRACKING:
            tabContent = <Interactive><TeamTrackingPage /></Interactive>;
            break;
        case TAB_IDS.OUTLET_MANAGEMENT:
            tabContent = <Interactive><OutletManagementPage /></Interactive>;
            break;
        case TAB_IDS.REPORTS:
            tabContent = <Interactive><ReportsPage /></Interactive>;
            break;
        case TAB_IDS.OUTLET_VALIDATION:
            tabContent = <Interactive><OutletValidationPage /></Interactive>;
            break;

        // Delivery Management Tabs
        case TAB_IDS.DELIVERY_PACKING_LIST:
            tabContent = <Interactive><PackingListManager /></Interactive>;
            break;
        case TAB_IDS.DELIVERY_ROUTES:
            tabContent = <Interactive><DeliveryRouteBuilder /></Interactive>;
            break;
        case TAB_IDS.DELIVERY_MONITOR:
            tabContent = <Interactive><DeliveryMonitor /></Interactive>;
            break;
        case TAB_IDS.DELIVERY_DRIVER_MAP:
            tabContent = <Interactive><DriverRouteMap /></Interactive>;
            break;

        // Admin System Configuration
        case TAB_IDS.SYSTEM_CONFIG:
            tabContent = <Interactive><AdminConfigPage onGoBack={onGoBack} /></Interactive>;
            break;
        case TAB_IDS.USER_MANAGEMENT:
            tabContent = <Interactive><AdminUserListPage onGoBack={onGoBack} /></Interactive>;
            break;

        default:
            tabContent = <MapOverlay><DashboardPage /></MapOverlay>;
            break;
    }

    return <Suspense fallback={<PageLoading />}>{tabContent}</Suspense>;
};
