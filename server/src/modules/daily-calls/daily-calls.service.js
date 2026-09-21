/**
 * daily-calls.service.js - BARREL (SRP refactor).
 * Each business logic lives in its own file under ./services/.
 * This file only re-exports to keep existing import paths stable.
 */
export { getDailyCallReport } from './services/get-daily-call-report.service.js';
