/**
 * customer-registrations.service.js - BARREL (SRP refactor).
 * Each business logic lives in its own file under ./services/.
 * This file only re-exports to keep existing import paths stable.
 */
export { sanitizeRegistrationPayload } from './services/sanitize-registration-payload.service.js';
export { searchPlaces } from './services/search-places.service.js';
export { reverseGeocodeCoordinates } from './services/reverse-geocode-coordinates.service.js';
export { validateGooglePlace } from './services/validate-google-place.service.js';
export { createRegistration } from './services/create-registration.service.js';
export { getRegistrations } from './services/get-registrations.service.js';
export { getRegistrationById } from './services/get-registration-by-id.service.js';
export { approveRegistration } from './services/approve-registration.service.js';
export { rejectRegistration } from './services/reject-registration.service.js';
export { finalizeAndRegisterByAdmin } from './services/finalize-and-register-by-admin.service.js';
