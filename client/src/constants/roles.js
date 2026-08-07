/**
 * Role constants & access-control configuration.
 * Single Responsibility: Define all user roles and their permission matrices.
 */

export const ROLES = Object.freeze({
    SALES: 'SALES',
    DRIVER: 'DRIVER',
    HELPER: 'HELPER',
    SUPERVISOR: 'SUPERVISOR',
    ADMIN: 'ADMIN',
    OPERATIONAL_MANAGER: 'OPERATIONAL_MANAGER',
});

export const ROLE_LABELS = Object.freeze({
    [ROLES.SALES]: 'Sales Field',
    [ROLES.DRIVER]: 'Driver',
    [ROLES.HELPER]: 'Helper',
    [ROLES.SUPERVISOR]: 'Supervisor',
    [ROLES.ADMIN]: 'Admin Penjualan',
    [ROLES.OPERATIONAL_MANAGER]: 'Manajer Operasional',
});

/** Roles allowed to view Route Planning (Master RJP) */
export const ROUTE_PLANNING_ROLES = Object.freeze([
    ROLES.SALES,
    ROLES.SUPERVISOR,
    ROLES.OPERATIONAL_MANAGER,
]);

/** Roles allowed to view Team Tracking */
export const TEAM_TRACKING_ROLES = Object.freeze([
    ROLES.SALES,
    ROLES.SUPERVISOR,
    ROLES.OPERATIONAL_MANAGER,
    ROLES.ADMIN,
]);

/** Roles allowed to view Reports */
export const REPORTS_ROLES = Object.freeze([
    ROLES.SUPERVISOR,
    ROLES.OPERATIONAL_MANAGER,
    ROLES.ADMIN,
]);

/** Roles allowed to manage Ops clusters (Ops Manager & Admin) */
export const OPS_MANAGER_ROLES = Object.freeze([
    ROLES.OPERATIONAL_MANAGER,
    ROLES.ADMIN,
]);

/** Roles that are field-operations (Sales / Driver / Helper) */
export const FIELD_ROLES = Object.freeze([
    ROLES.SALES,
    ROLES.DRIVER,
    ROLES.HELPER,
]);
