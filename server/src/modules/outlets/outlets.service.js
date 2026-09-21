/**
 * outlets.service.js - BARREL (SRP refactor).
 * Each business logic lives in its own file under ./services/.
 * This file only re-exports to keep existing import paths stable.
 */
export { getOutlets } from './services/get-outlets.service.js';
export { getOutletById } from './services/get-outlet-by-id.service.js';
export { createOutlet } from './services/create-outlet.service.js';
export { updateOutlet } from './services/update-outlet.service.js';
export { deleteOutlet } from './services/delete-outlet.service.js';
