/**
 * vehicles.service.js - BARREL (SRP refactor).
 * Each business logic lives in its own file under ./services/.
 * This file only re-exports to keep existing import paths stable.
 */
export { getVehicles } from './services/get-vehicles.service.js';
export { getVehicleById } from './services/get-vehicle-by-id.service.js';
export { createVehicle } from './services/create-vehicle.service.js';
export { updateVehicle } from './services/update-vehicle.service.js';
export { deleteVehicle } from './services/delete-vehicle.service.js';
export { recordMaintenance } from './services/record-maintenance.service.js';
