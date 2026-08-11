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
router.post('/', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(createClusterSchema), clusterController.create);
router.patch('/:id', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(updateClusterSchema), clusterController.update);
router.delete('/:id', authorize('ADMIN', 'MANAJER_OPERASIONAL'), clusterController.remove);

// New Create Cluster Flow
router.post('/nearest-outlets', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(getNearestOutletsSchema), clusterController.getNearestOutlets);
router.post('/generate-routes', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(generateRoutesSchema), clusterController.generateRoutes);
router.post('/full', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(createFullClusterSchema), clusterController.createFull);

// Manual Edit
router.patch('/:id/outlets', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(updateOutletsSchema), clusterController.updateOutlets);
router.patch('/:id/routes', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(updateRoutesSchema), clusterController.updateRoutes);
router.patch('/:id/routes/:routeIndex/activate', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(setActiveRouteSchema), clusterController.setActiveRoute);

export default router;
