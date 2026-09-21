/**
 * orders.service.js - BARREL (SRP refactor).
 * Each business logic lives in its own file under ./services/.
 * This file only re-exports to keep existing import paths stable.
 */
export { createOrder } from './services/create-order.service.js';
export { getOrders } from './services/get-orders.service.js';
export { getOrderById } from './services/get-order-by-id.service.js';
export { approveOrder } from './services/approve-order.service.js';
export { rejectOrder } from './services/reject-order.service.js';
