/**
 * reports.service.js - BARREL (SRP refactor).
 * Each business logic lives in its own file under ./services/.
 * This file only re-exports to keep existing import paths stable.
 */
export { getDashboardSummary } from './services/get-dashboard-summary.service.js';
export { getSalesReport } from './services/get-sales-report.service.js';
export { getOutletReport } from './services/get-outlet-report.service.js';
export { getWeeklyReport } from './services/get-weekly-report.service.js';
export { getMtdReport } from './services/get-mtd-report.service.js';
