import { Router } from 'express';
import * as clusterController from './clusters.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { 
  createClusterSchema, 
  updateClusterSchema,
  getNearestOutletsSchema,
  generateRoutesSchema,
  createFullClusterSchema,
  updateOutletsSchema,
  updateRoutesSchema,
  setActiveRouteSchema
} from './clusters.schema.js';

const router = Router();

router.use(authenticate);

// Existing CRUD
router.get('/', clusterController.getAll);
router.get('/:id', clusterController.getById);
router.post('/', authorize('ADMIN', 'SUPERVISOR'), validate(createClusterSchema), clusterController.create);
router.patch('/:id', authorize('ADMIN', 'SUPERVISOR'), validate(updateClusterSchema), clusterController.update);
router.delete('/:id', authorize('ADMIN', 'SUPERVISOR'), clusterController.remove);

// New Create Cluster Flow
router.post('/nearest-outlets', authorize('ADMIN', 'SUPERVISOR'), validate(getNearestOutletsSchema), clusterController.getNearestOutlets);
router.post('/generate-routes', authorize('ADMIN', 'SUPERVISOR'), validate(generateRoutesSchema), clusterController.generateRoutes);
router.post('/full', authorize('ADMIN', 'SUPERVISOR'), validate(createFullClusterSchema), clusterController.createFull);

// Manual Edit
router.patch('/:id/outlets', authorize('ADMIN', 'SUPERVISOR'), validate(updateOutletsSchema), clusterController.updateOutlets);
router.patch('/:id/routes', authorize('ADMIN', 'SUPERVISOR'), validate(updateRoutesSchema), clusterController.updateRoutes);
router.patch('/:id/routes/:routeIndex/activate', authorize('ADMIN', 'SUPERVISOR'), validate(setActiveRouteSchema), clusterController.setActiveRoute);

export default router;
