/**
 * cluster-generator.service.js - BARREL (SRP refactor).
 * Each business logic lives in its own file under ./services/.
 * This file only re-exports to keep existing import paths stable.
 */
export { haversineKm } from './services/haversine-km.service.js';
export { getWeekStart } from './services/get-week-start.service.js';
export { splitIntoDayQuotas } from './services/split-into-day-quotas.service.js';
export { assignByProximity } from './services/assign-by-proximity.service.js';
export { buildSalesClusterPlan } from './services/build-sales-cluster-plan.service.js';
export { DAY_ORDER, DAY_LABELS } from './services/cluster-generator.helpers.js';
