import { TAB_IDS } from '../constants/tabIds.js';

const VALID_TABS = new Set(Object.values(TAB_IDS));

const PAYLOAD_LINK_KEYS = [
  'outletFieldTask',
  'outletReview',
  'orderDetail',
  'deliveryRoute',
  'deliveryStop',
  'packingDetail',
  'attentionItem',
  'followUp',
  'warehouseVehicle',
  'driverTrip',
  'driverStop',
];

const attentionTabForRole = (role) => {
  if (role === 'ADMIN') return TAB_IDS.ADMIN_ATTENTION;
  if (role === 'SUPERVISOR') return TAB_IDS.SPV_ATTENTION;
  if (role === 'KEPALA_GUDANG') return TAB_IDS.WAREHOUSE_ATTENTION;
  if (role === 'SALES') return TAB_IDS.SALES_FOLLOW_UP;
  if (role === 'SUPIR') return TAB_IDS.DRIVER_TRIPS;
  return TAB_IDS.ROLE_WORKSPACE;
};

const extractPayloadLinkParams = (payload) => {
  const params = {};
  for (const key of PAYLOAD_LINK_KEYS) {
    if (payload[key]) params[key] = payload[key];
  }
  return params;
};

const pickTextParams = (type, payload) => {
  const params = {};
  if (payload.routeId) params.deliveryRoute = payload.routeId;
  if (payload.stopId) params.deliveryStop = payload.stopId;
  if (payload.orderId) params.orderDetail = payload.orderId;
  if (payload.packingListId) params.packingDetail = payload.packingListId;
  if (payload.vehicleId) params.warehouseVehicle = payload.vehicleId;
  if (payload.issueId) {
    params.attentionCategory = 'ISSUE';
    params.attentionItem = `issue:${payload.issueId}`;
  }
  if (type === 'ORDER_CREATED' || type === 'ORDER_REVIEW_ASSIGNED') params.orderStatus = 'PENDING';
  return params;
};

/**
 * Resolves both target workspace tab ID and URL query parameters (`useWorkspaceState`)
 * for an inbox notification so clicking opens the exact referenced task.
 */
export const resolveNotificationTarget = (notif, userOrRole) => {
  const role = typeof userOrRole === 'object' ? userOrRole?.role : userOrRole;
  const payload = notif?.payload && typeof notif.payload === 'object' ? notif.payload : {};
  const type = String(notif?.type || '').toUpperCase();
  const title = String(notif?.title || '');
  const text = `${notif?.type || ''} ${title} ${notif?.message || ''}`.toLowerCase();

  // Priority 1: Explicit target tab declared in server notification payload
  if (payload.tab && VALID_TABS.has(payload.tab)) {
    return {
      tab: payload.tab,
      params: extractPayloadLinkParams(payload),
    };
  }

  // Priority 2: Exact backend notification type + structured payload IDs
  if (type === 'SLA_ESCALATION') {
    return {
      tab: attentionTabForRole(role),
      params: {
        attentionFilter: 'ALL',
        attentionCategory: payload.category || 'ALL',
        attentionSearch: '',
        attentionPage: 1,
        attentionItem: payload.attentionKey || '',
      },
    };
  }

  if (type === 'DELIVERY_FOLLOW_UP') {
    if (role === 'SUPIR') {
      return {
        tab: TAB_IDS.DRIVER_TRIPS,
        params: { driverTrip: payload.routeId || '', driverStop: payload.stopId || '' },
      };
    }
    if (role === 'SALES') {
      if (payload.orderId) {
        return {
          tab: TAB_IDS.SALES_ORDERS,
          params: { salesOrderStatus: 'ALL', salesOrder: payload.orderId },
        };
      }
      return { tab: TAB_IDS.SALES_FOLLOW_UP, params: {} };
    }
    const isResolved = /diselesaikan/i.test(title);
    if (payload.issueId) {
      return {
        tab: attentionTabForRole(role),
        params: {
          attentionFilter: isResolved ? 'HISTORY' : 'ALL',
          attentionCategory: 'ISSUE',
          attentionSearch: '',
          attentionPage: 1,
          attentionItem: isResolved ? `history:issue:${payload.issueId}` : `issue:${payload.issueId}`,
        },
      };
    }
    if (payload.routeId) {
      return {
        tab: TAB_IDS.DELIVERY_MONITOR,
        params: { deliveryRoute: payload.routeId, deliveryStop: payload.stopId || '' },
      };
    }
    return {
      tab: attentionTabForRole(role),
      params: {
        attentionFilter: isResolved ? 'HISTORY' : 'ALL',
        attentionCategory: 'ISSUE',
        attentionSearch: '',
        attentionPage: 1,
      },
    };
  }

  if (
    type === 'DELIVERY_PREPARATION' ||
    type === 'DELIVERY_RETURN_ASSIGNED' ||
    type === 'DELIVERY_ASSIGNED'
  ) {
    if (role === 'SUPIR') {
      return {
        tab: TAB_IDS.DRIVER_TRIPS,
        params: { driverTrip: payload.routeId || '', driverStop: payload.stopId || '' },
      };
    }
    return {
      tab: TAB_IDS.DELIVERY_MONITOR,
      params: { deliveryRoute: payload.routeId || '', deliveryStop: payload.stopId || '' },
    };
  }

  if (type.startsWith('ORDER_')) {
    if (role === 'SALES') {
      return {
        tab: TAB_IDS.SALES_ORDERS,
        params: { salesOrderStatus: 'ALL', salesOrder: payload.orderId || '' },
      };
    }
    if (role === 'KEPALA_GUDANG') {
      return {
        tab: TAB_IDS.DELIVERY_PACKING_LIST,
        params: { packingOrder: payload.orderId || '' },
      };
    }
    if (role === 'SUPERVISOR') {
      return {
        tab: TAB_IDS.SPV_APPROVAL,
        params: { spvApproval: 'orders', orderStatus: 'ALL', orderDetail: payload.orderId || '' },
      };
    }
    return {
      tab: TAB_IDS.ADMIN_APPROVAL,
      params: { orderSection: 'orders', orderStatus: 'ALL', orderDetail: payload.orderId || '' },
    };
  }

  if (type === 'UNLOCK_REQUEST' || type === 'UNLOCK_APPROVED' || type === 'UNLOCK_REJECTED') {
    if (role === 'SALES') return { tab: TAB_IDS.SALES_VISITS, params: {} };
    if (role === 'SUPERVISOR') {
      return {
        tab: TAB_IDS.SPV_APPROVAL,
        params: {
          spvApproval: 'unlock',
          spvQueue: type === 'UNLOCK_REQUEST' ? 'pending' : 'history',
          spvRequest: payload.unlockRequestId ? `UNLOCK_REQUEST:${payload.unlockRequestId}` : '',
        },
      };
    }
    return { tab: TAB_IDS.ADMIN_APPROVAL, params: { orderSection: 'unlock' } };
  }

  if (
    type === 'ROUTE_CHANGE_REPORTED' ||
    type === 'ROUTE_CHANGE_ASSIGNED' ||
    type === 'ROUTE_CHANGE_DECIDED'
  ) {
    if (role === 'SALES') return { tab: TAB_IDS.SALES_VISITS, params: {} };
    const reqId = payload.routeChangeRequestId || payload.requestId;
    if (role === 'SUPERVISOR') {
      return {
        tab: TAB_IDS.SPV_APPROVAL,
        params: {
          spvApproval: 'closed',
          spvQueue: type === 'ROUTE_CHANGE_DECIDED' ? 'history' : 'pending',
          spvRequest: reqId ? `CLOSED_SHOP:${reqId}` : '',
        },
      };
    }
    return {
      tab: TAB_IDS.ADMIN_ATTENTION,
      params: {
        attentionFilter: 'ALL',
        attentionCategory: 'EXCEPTION',
        attentionSearch: '',
        attentionPage: 1,
      },
    };
  }

  if (
    type === 'OFF_PJP_SUBMITTED' ||
    type === 'OFF_PJP_VALIDATED' ||
    type === 'OFF_PJP_REJECTED'
  ) {
    if (role === 'SALES') return { tab: TAB_IDS.SALES_VISITS, params: {} };
    if (role === 'SUPERVISOR') {
      return {
        tab: TAB_IDS.SPV_APPROVAL,
        params: {
          spvApproval: 'offpjp',
          spvQueue: type === 'OFF_PJP_SUBMITTED' ? 'pending' : 'history',
          spvRequest: payload.offPjpAttendanceId ? `attendance:${payload.offPjpAttendanceId}` : '',
        },
      };
    }
    return {
      tab: TAB_IDS.ADMIN_ATTENTION,
      params: {
        attentionFilter: 'ALL',
        attentionCategory: 'EXCEPTION',
        attentionSearch: '',
        attentionPage: 1,
      },
    };
  }

  if (type === 'EXCEPTION_CORRECTION_REQUESTED' || type === 'EXCEPTION_CLARIFIED') {
    if (role === 'SALES') return { tab: TAB_IDS.SALES_FOLLOW_UP, params: {} };
    return {
      tab: attentionTabForRole(role),
      params: {
        attentionFilter: 'ALL',
        attentionCategory: 'EXCEPTION',
        attentionSearch: '',
        attentionPage: 1,
        attentionItem: payload.exceptionId ? `operational:${payload.exceptionId}` : '',
      },
    };
  }

  if (
    type === 'OUTLET_REGISTRATION_SUBMITTED' ||
    type === 'OUTLET_REGISTRATION_APPROVED' ||
    type === 'OUTLET_REGISTRATION_REJECTED' ||
    type === 'OUTLET_REGISTERED_ACTIVE'
  ) {
    if (role === 'SALES') {
      return { tab: TAB_IDS.OUTLET_REGISTRATION, params: { registrationView: 'HISTORY' } };
    }
    return {
      tab: TAB_IDS.OUTLET_APPROVAL,
      params: {
        outletApprovalStatus: payload.status || 'ALL',
        outletApprovalId: payload.registrationId || '',
      },
    };
  }

  if (
    type === 'OUTLET_FIELD_ASSIGNED' ||
    type === 'OUTLET_FIELD_SUBMITTED' ||
    type === 'OUTLET_FIELD_REVIEWED' ||
    type === 'OUTLET_FIELD_CANCELLED'
  ) {
    if (role === 'SALES') {
      return {
        tab: TAB_IDS.SALES_FOLLOW_UP,
        params: { outletFieldTask: payload.outletFieldTask || '' },
      };
    }
    return {
      tab: TAB_IDS.OUTLET_VALIDATION,
      params: { outletReview: payload.outletReview || '' },
    };
  }

  if (type === 'VEHICLE_SERVICE_DUE') {
    return {
      tab: role === 'KEPALA_GUDANG' ? TAB_IDS.WAREHOUSE_VEHICLES : TAB_IDS.ADMIN_VEHICLES,
      params: { warehouseVehicle: payload.vehicleId || '' },
    };
  }

  if (type === 'ASSIGNMENT_SCHEDULE_FAILED') {
    return { tab: TAB_IDS.SYSTEM_CONFIG, params: {} };
  }

  if (type === 'TEAM_ASSIGNMENT') {
    if (role === 'SALES') return { tab: TAB_IDS.SALES_VISITS, params: {} };
    if (role === 'SUPERVISOR') return { tab: TAB_IDS.SPV_MONITOR, params: {} };
    return { tab: TAB_IDS.ROUTE_PLANNING, params: {} };
  }

  // Generic payload entity fallbacks when type isn't recognized
  if (payload.packingListId) {
    return { tab: TAB_IDS.DELIVERY_PACKING_LIST, params: { packingDetail: payload.packingListId } };
  }
  if (payload.activityId) {
    if (role === 'SALES') return { tab: TAB_IDS.SALES_FOLLOW_UP, params: {} };
    return {
      tab: attentionTabForRole(role),
      params: {
        attentionFilter: 'ALL',
        attentionCategory: 'VISIT',
        attentionSearch: '',
        attentionPage: 1,
        attentionItem: `visit:${payload.activityId}`,
      },
    };
  }
  if (payload.issueId) {
    return {
      tab: attentionTabForRole(role),
      params: {
        attentionFilter: 'ALL',
        attentionCategory: 'ISSUE',
        attentionSearch: '',
        attentionPage: 1,
        attentionItem: role === 'SUPIR' ? '' : `issue:${payload.issueId}`,
      },
    };
  }
  if (payload.routeId) {
    return {
      tab: role === 'SUPIR' ? TAB_IDS.DRIVER_TRIPS : TAB_IDS.DELIVERY_MONITOR,
      params:
        role === 'SUPIR'
          ? { driverTrip: payload.routeId, driverStop: payload.stopId || '' }
          : { deliveryRoute: payload.routeId, deliveryStop: payload.stopId || '' },
    };
  }
  if (payload.orderId) {
    if (role === 'SALES') {
      return {
        tab: TAB_IDS.SALES_ORDERS,
        params: { salesOrderStatus: 'ALL', salesOrder: payload.orderId },
      };
    }
    return {
      tab: role === 'SUPERVISOR' ? TAB_IDS.SPV_APPROVAL : TAB_IDS.ADMIN_APPROVAL,
      params: { orderStatus: 'ALL', orderDetail: payload.orderId },
    };
  }
  if (payload.registrationId) {
    return role === 'SALES'
      ? { tab: TAB_IDS.OUTLET_REGISTRATION, params: { registrationView: 'HISTORY' } }
      : {
          tab: TAB_IDS.OUTLET_APPROVAL,
          params: { outletApprovalStatus: 'ALL', outletApprovalId: payload.registrationId },
        };
  }
  if (payload.vehicleId) {
    return {
      tab: role === 'KEPALA_GUDANG' ? TAB_IDS.WAREHOUSE_VEHICLES : TAB_IDS.ADMIN_VEHICLES,
      params: { warehouseVehicle: payload.vehicleId },
    };
  }
  if (payload.exceptionId) {
    return {
      tab: attentionTabForRole(role),
      params: {
        attentionFilter: 'ALL',
        attentionCategory: 'EXCEPTION',
        attentionSearch: '',
        attentionPage: 1,
        attentionItem: `operational:${payload.exceptionId}`,
      },
    };
  }
  if (payload.outletId) {
    return role === 'SALES'
      ? { tab: TAB_IDS.SALES_VISITS, params: {} }
      : { tab: TAB_IDS.OUTLET_MANAGEMENT, params: { outletId: payload.outletId } };
  }

  // Priority 3: Keyword fallback & final role attention screen fallback
  if (text.includes('noo') || text.includes('registrasi') || text.includes('toko baru')) {
    return {
      tab: role === 'SALES' ? TAB_IDS.OUTLET_REGISTRATION : TAB_IDS.OUTLET_APPROVAL,
      params: role === 'SALES' ? { registrationView: 'HISTORY' } : {},
    };
  }
  if (text.includes('validasi outlet') || text.includes('field_task')) {
    return { tab: role === 'SALES' ? TAB_IDS.SALES_VISITS : TAB_IDS.OUTLET_VALIDATION, params: {} };
  }
  if (text.includes('packing')) {
    return { tab: TAB_IDS.DELIVERY_PACKING_LIST, params: {} };
  }
  if (text.includes('pengiriman') || text.includes('trip') || text.includes('retur')) {
    return {
      tab: role === 'SUPIR' ? TAB_IDS.DRIVER_TRIPS : TAB_IDS.DELIVERY_MONITOR,
      params: pickTextParams(type, payload),
    };
  }
  if (text.includes('masalah') || text.includes('penanganan') || text.includes('keluhan')) {
    return {
      tab: attentionTabForRole(role),
      params: { attentionFilter: 'ALL', attentionCategory: 'ISSUE', attentionSearch: '', attentionPage: 1 },
    };
  }
  if (text.includes('order')) {
    if (role === 'SALES') return { tab: TAB_IDS.SALES_ORDERS, params: {} };
    return {
      tab: role === 'SUPERVISOR' ? TAB_IDS.SPV_APPROVAL : TAB_IDS.ADMIN_APPROVAL,
      params: { orderStatus: 'ALL' },
    };
  }
  if (text.includes('kendaraan') || text.includes('servis')) {
    return {
      tab: role === 'KEPALA_GUDANG' ? TAB_IDS.WAREHOUSE_VEHICLES : TAB_IDS.ADMIN_VEHICLES,
      params: {},
    };
  }
  if (
    text.includes('tutup') ||
    text.includes('kunci') ||
    text.includes('unlock') ||
    text.includes('rute') ||
    text.includes('reroute') ||
    text.includes('absen')
  ) {
    if (role === 'SALES') return { tab: TAB_IDS.SALES_VISITS, params: {} };
    return {
      tab: role === 'SUPERVISOR' ? TAB_IDS.SPV_APPROVAL : TAB_IDS.ADMIN_APPROVAL,
      params: {},
    };
  }

  return { tab: attentionTabForRole(role), params: {} };
};

/**
 * Resolves the target workspace tab ID for an inbox notification item based on user role.
 */
export const resolveNotificationTab = (notif, userOrRole) =>
  resolveNotificationTarget(notif, userOrRole)?.tab || null;
