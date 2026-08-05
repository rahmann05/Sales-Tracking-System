/**
 * Application-wide constants to avoid magic strings scattered across the codebase.
 * Update here whenever business rules change.
 */

export const ROLES = /** @type {const} */ ({
  SALES: 'SALES',
  DRIVER: 'DRIVER',
  HELPER: 'HELPER',
  SUPERVISOR: 'SUPERVISOR',
  ADMIN: 'ADMIN',
  MANAJER_OPERASIONAL: 'MANAJER_OPERASIONAL',
});

export const PJP_STATUS = /** @type {const} */ ({
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
});

export const PJP_TYPE = /** @type {const} */ ({
  SALES: 'SALES',
  DRIVER: 'DRIVER',
  HELPER: 'HELPER',
});

export const VISIT_STATUS = /** @type {const} */ ({
  PENDING: 'PENDING',
  VISITED: 'VISITED',
  CLOSED_REPORTED: 'CLOSED_REPORTED',
  SKIPPED: 'SKIPPED',
});

export const ORDER_STATUS = /** @type {const} */ ({
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

export const ROUTE_CHANGE_TYPE = /** @type {const} */ ({
  REROUTE: 'REROUTE',
  SKIP: 'SKIP',
});

export const ROUTE_CHANGE_STATUS = /** @type {const} */ ({
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
});

export const ATTENDANCE_TYPE = /** @type {const} */ ({
  IN: 'IN',
  OUT: 'OUT',
});

export const NOTIFICATION_TYPES = /** @type {const} */ ({
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_APPROVED: 'ORDER_APPROVED',
  ORDER_REJECTED: 'ORDER_REJECTED',
  ROUTE_CHANGE_REPORTED: 'ROUTE_CHANGE_REPORTED',
  REROUTE_APPROVAL_REQUIRED: 'REROUTE_APPROVAL_REQUIRED',
  SKIP_OUTLET_INFO: 'SKIP_OUTLET_INFO',
  ROUTE_SKIP_ACKNOWLEDGED: 'ROUTE_SKIP_ACKNOWLEDGED',
  REROUTE_APPROVED: 'REROUTE_APPROVED',
  REROUTE_REJECTED: 'REROUTE_REJECTED',
});

export const SOCKET_EVENTS = /** @type {const} */ ({
  NOTIFICATION: 'notification',
});
