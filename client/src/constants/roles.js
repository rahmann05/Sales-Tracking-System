/**
 * Role constants & access-control configuration.
 * Single Responsibility: Define all user roles and their permission matrices.
 */

export const ROLES = Object.freeze({
    SALES: 'SALES',
    SUPERVISOR: 'SUPERVISOR',
    ADMIN: 'ADMIN',
    KEPALA_GUDANG: 'KEPALA_GUDANG',
    SUPIR: 'SUPIR',
});

export const ROLE_LABELS = Object.freeze({
    [ROLES.SALES]: 'Sales Field',
    [ROLES.SUPERVISOR]: 'Supervisor',
    [ROLES.ADMIN]: 'Admin Penjualan',
    [ROLES.KEPALA_GUDANG]: 'Kepala Gudang',
    [ROLES.SUPIR]: 'Supir',
});

export const ROUTE_PLANNING_ROLES = Object.freeze([
    ROLES.SALES,
    ROLES.SUPERVISOR,
    ROLES.ADMIN,
]);

export const OUTLET_VALIDATION_ROLES = Object.freeze([
    ROLES.SUPERVISOR,
    ROLES.ADMIN,
]);

/** Roles allowed to view Team Tracking */
export const TEAM_TRACKING_ROLES = Object.freeze([
    ROLES.SUPERVISOR,
    ROLES.ADMIN,
]);

/** Roles allowed to view Reports */
export const REPORTS_ROLES = Object.freeze([
    ROLES.SUPERVISOR,
    ROLES.ADMIN,
]);

/** Roles allowed to manage clusters & operational route planning */
export const CLUSTER_MANAGEMENT_ROLES = Object.freeze([
    ROLES.SUPERVISOR,
    ROLES.ADMIN,
]);
export const OPS_MANAGER_ROLES = CLUSTER_MANAGEMENT_ROLES;

/** Roles that are field-operations */
export const FIELD_ROLES = Object.freeze([
    ROLES.SALES,
    ROLES.SUPIR,
]);

export const OUTLET_REGISTRATION_ROLES = Object.freeze([
    ROLES.SALES,
    ROLES.SUPERVISOR,
    ROLES.ADMIN,
]);

export const OUTLET_APPROVAL_ROLES = Object.freeze([
    ROLES.SUPERVISOR,
    ROLES.ADMIN,
]);

export const OUTLET_REGISTRATION_REPORT_ROLES = Object.freeze([
    ROLES.SUPERVISOR,
    ROLES.ADMIN,
]);

export const DAILY_CALL_ROLES = Object.freeze([
    ROLES.SUPERVISOR,
    ROLES.ADMIN,
]);

/** Roles for delivery management (Kepala Gudang) */
export const DELIVERY_MANAGEMENT_ROLES = Object.freeze([
    ROLES.KEPALA_GUDANG,
    ROLES.ADMIN,
]);

/** Roles for delivery field (Supir) */
export const DELIVERY_FIELD_ROLES = Object.freeze([
    ROLES.SUPIR,
]);
