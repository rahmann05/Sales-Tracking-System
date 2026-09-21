/**
 * customer-photo.service.js - BARREL (SRP refactor).
 * Each business logic lives in its own file under ./services/.
 * This file only re-exports to keep existing import paths stable.
 */
export { generatePhotoId } from './services/generate-photo-id.service.js';
export { saveOutletPhoto } from './services/save-outlet-photo.service.js';
