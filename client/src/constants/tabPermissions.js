import { ROLES } from './roles';
import {
  ROUTE_PLANNING_ROLES,
  TEAM_TRACKING_ROLES,
  OUTLET_VALIDATION_ROLES,
  OUTLET_APPROVAL_ROLES,
  OUTLET_REGISTRATION_REPORT_ROLES,
  DAILY_CALL_ROLES,
  DELIVERY_MANAGEMENT_ROLES,
  DELIVERY_FIELD_ROLES,
} from './roles';
import { TAB_IDS } from './tabIds.js';

const TAB_PERMISSION_KEYS = {
  [TAB_IDS.ADMIN_APPROVAL]: ['can_approve_order', 'can_unlock_absensi'],
  [TAB_IDS.DASHBOARD]: ['can_view_dashboard'],
  [TAB_IDS.DAILY_CALL_MONITOR]: ['can_view_daily_call'],
  [TAB_IDS.ROUTE_PLANNING]: ['can_access_rjp', 'can_manage_rjp'],
  [TAB_IDS.CREATE_CLUSTER]: ['can_manage_clusters'],
  [TAB_IDS.MASTER_CLUSTERS]: ['can_manage_clusters'],
  [TAB_IDS.TEAM_TRACKING]: ['can_view_team', 'can_view_live_tracking'],
  [TAB_IDS.OUTLET_MANAGEMENT]: ['can_manage_outlets'],
  [TAB_IDS.OUTLET_REGISTRATION]: ['can_register_outlet'],
  [TAB_IDS.OUTLET_APPROVAL]: ['can_approve_outlet'],
  [TAB_IDS.OUTLET_REGISTRATION_REPORT]: ['can_view_outlet_report'],
  [TAB_IDS.REPORTS]: ['can_view_reports'],
  [TAB_IDS.OUTLET_VALIDATION]: ['can_validate_outlet'],
  [TAB_IDS.DELIVERY_PACKING_LIST]: ['can_manage_packing_list'],
  [TAB_IDS.DELIVERY_ROUTES]: ['can_manage_delivery_routes'],
  [TAB_IDS.DELIVERY_MONITOR]: ['can_monitor_delivery'],
  [TAB_IDS.DELIVERY_DRIVER_MAP]: ['can_access_driver_map'],
};

const ROLE_RESTRICTED_TABS = {
  [TAB_IDS.DAILY_CALL_MONITOR]: DAILY_CALL_ROLES,
  [TAB_IDS.ROUTE_PLANNING]: ROUTE_PLANNING_ROLES,
  [TAB_IDS.TEAM_TRACKING]: TEAM_TRACKING_ROLES,
  [TAB_IDS.REPORTS]: ['ADMIN', 'SUPERVISOR', 'SALES'],
  [TAB_IDS.OUTLET_REGISTRATION]: ['ADMIN', 'SUPERVISOR', 'SALES'],
  [TAB_IDS.OUTLET_APPROVAL]: OUTLET_APPROVAL_ROLES,
  [TAB_IDS.OUTLET_REGISTRATION_REPORT]: OUTLET_REGISTRATION_REPORT_ROLES,
  [TAB_IDS.OUTLET_VALIDATION]: OUTLET_VALIDATION_ROLES,
  [TAB_IDS.OUTLET_MANAGEMENT]: ['ADMIN', 'SUPERVISOR'],
  [TAB_IDS.CREATE_CLUSTER]: ['ADMIN', 'SUPERVISOR'],
  [TAB_IDS.MASTER_CLUSTERS]: ['ADMIN', 'SUPERVISOR'],
  [TAB_IDS.DELIVERY_PACKING_LIST]: DELIVERY_MANAGEMENT_ROLES,
  [TAB_IDS.DELIVERY_ROUTES]: DELIVERY_MANAGEMENT_ROLES,
  [TAB_IDS.DELIVERY_MONITOR]: DELIVERY_MANAGEMENT_ROLES,
  [TAB_IDS.DELIVERY_DRIVER_MAP]: DELIVERY_FIELD_ROLES,
  [TAB_IDS.ADMIN_APPROVAL]: ['ADMIN'],
};

const WAREHOUSE_TABS = [
  TAB_IDS.WAREHOUSE_ATTENTION,
  TAB_IDS.WAREHOUSE_VEHICLES,
  TAB_IDS.WAREHOUSE_ATTENDANCE,
];

const SPV_TABS = [
  TAB_IDS.SPV_MONITOR,
  TAB_IDS.SPV_APPROVAL,
  TAB_IDS.SPV_FIELD,
  TAB_IDS.SPV_ATTENTION,
];

const ADMIN_ONLY_TABS = [
  TAB_IDS.SYSTEM_CONFIG,
  TAB_IDS.USER_MANAGEMENT,
  TAB_IDS.ADMIN_ATTENTION,
  TAB_IDS.ADMIN_PRODUCTS,
  TAB_IDS.ADMIN_PJP,
  TAB_IDS.ADMIN_ATTENDANCE,
  TAB_IDS.ADMIN_MASTERS,
  TAB_IDS.ADMIN_VEHICLES,
];

export function isTabPermissionAllowed(tabId, user) {
  if (!user) return false;
  if (ROLE_RESTRICTED_TABS[tabId] && !ROLE_RESTRICTED_TABS[tabId].includes(user.role)) return false;
  if (WAREHOUSE_TABS.includes(tabId)) {
    return (
      user?.role === ROLES.KEPALA_GUDANG &&
      (tabId !== TAB_IDS.WAREHOUSE_ATTENTION || user.permissions?.can_monitor_delivery !== false)
    );
  }
  if (tabId === TAB_IDS.DRIVER_TRIPS) {
    return user?.role === ROLES.SUPIR && user.permissions?.can_access_driver_map !== false;
  }
  if (tabId === TAB_IDS.SALES_FOLLOW_UP) {
    return user?.role === ROLES.SALES && user.permissions?.can_view_follow_up !== false;
  }
  if ([TAB_IDS.SALES_VISITS, TAB_IDS.SALES_ORDERS].includes(tabId)) {
    return user?.role === ROLES.SALES;
  }
  if (SPV_TABS.includes(tabId)) {
    return (
      user?.role === ROLES.SUPERVISOR &&
      (tabId !== TAB_IDS.SPV_MONITOR ||
        ['can_view_daily_call', 'can_view_live_tracking'].some(
          (key) => user.permissions?.[key] !== false
        ))
    );
  }
  if (tabId === TAB_IDS.SYSTEM_CONFIG) {
    return user?.role === ROLES.ADMIN && user.permissions?.can_manage_system_config !== false;
  }
  if (tabId === TAB_IDS.USER_MANAGEMENT) {
    return (
      user?.role === ROLES.ADMIN &&
      ['can_manage_users', 'can_manage_roles'].some((key) => user.permissions?.[key] !== false)
    );
  }
  if (ADMIN_ONLY_TABS.includes(tabId)) return user.role === ROLES.ADMIN;
  const keys = TAB_PERMISSION_KEYS[tabId];
  return !keys || keys.some((key) => user.permissions?.[key] !== false);
}
