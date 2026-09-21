/**
 * config.service.js - BARREL (SRP refactor).
 * Each business logic lives in its own file under ./services/.
 * This file only re-exports to keep existing import paths stable.
 */
export { getConfigByKey } from './services/get-config-by-key.service.js';
export { upsertConfig } from './services/upsert-config.service.js';
