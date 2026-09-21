/**
 * clusters.service.js - BARREL (SRP refactor).
 * Each business logic lives in its own file under ./services/.
 * This file only re-exports to keep existing import paths stable.
 */
export { getClusters } from './services/get-clusters.service.js';
export { getClusterById } from './services/get-cluster-by-id.service.js';
export { createCluster } from './services/create-cluster.service.js';
export { updateCluster } from './services/update-cluster.service.js';
export { deleteCluster } from './services/delete-cluster.service.js';
export { getNearestOutlets } from './services/get-nearest-outlets.service.js';
export { generateClusterRoutes } from './services/generate-cluster-routes.service.js';
export { createClusterFull } from './services/create-cluster-full.service.js';
export { updateClusterOutlets } from './services/update-cluster-outlets.service.js';
export { updateClusterRoutes } from './services/update-cluster-routes.service.js';
export { setActiveRoute } from './services/set-active-route.service.js';
