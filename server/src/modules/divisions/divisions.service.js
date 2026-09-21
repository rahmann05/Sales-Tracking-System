/**
 * divisions.service.js - BARREL (SRP refactor).
 * Each business logic lives in its own file under ./services/.
 * This file only re-exports to keep existing import paths stable.
 */
export { getDivisions } from './services/get-divisions.service.js';
export { getDivisionById } from './services/get-division-by-id.service.js';
export { createDivision } from './services/create-division.service.js';
export { updateDivision } from './services/update-division.service.js';
export { deleteDivision } from './services/delete-division.service.js';
