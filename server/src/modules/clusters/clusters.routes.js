import { Router } from 'express';
import * as clusterController from './clusters.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createClusterSchema, updateClusterSchema } from './clusters.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', clusterController.getAll);
router.get('/:id', clusterController.getById);
router.post('/', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(createClusterSchema), clusterController.create);
router.patch('/:id', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(updateClusterSchema), clusterController.update);
router.delete('/:id', authorize('ADMIN', 'MANAJER_OPERASIONAL'), clusterController.remove);

export default router;
