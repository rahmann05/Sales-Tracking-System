/**
 * products.service.js - BARREL (SRP refactor).
 * Each business logic lives in its own file under ./services/.
 * This file only re-exports to keep existing import paths stable.
 */
export { getProducts } from './services/get-products.service.js';
export { getProductById } from './services/get-product-by-id.service.js';
export { createProduct } from './services/create-product.service.js';
export { updateProduct } from './services/update-product.service.js';
export { deleteProduct } from './services/delete-product.service.js';
