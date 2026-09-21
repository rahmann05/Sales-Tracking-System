/**
 * outlet-lock.service.js - BARREL (SRP refactor).
 * Each business logic lives in its own file under ./services/.
 * This file only re-exports to keep existing import paths stable.
 */
export { lockOutlet } from './services/lock-outlet.service.js';
export { unlockOutletDirect } from './services/unlock-outlet-direct.service.js';
export { requestOutletUnlock } from './services/request-outlet-unlock.service.js';
export { handleUnlockRequest } from './services/handle-unlock-request.service.js';
export { getUnlockRequests } from './services/get-unlock-requests.service.js';
