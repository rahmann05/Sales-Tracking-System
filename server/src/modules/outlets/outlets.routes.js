import { Router } from 'express';
import * as outletController from './outlets.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createOutletSchema, updateOutletSchema } from './outlets.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', outletController.getAll);
router.get('/:id', outletController.getById);
router.post('/', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(createOutletSchema), outletController.create);
router.patch('/:id', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(updateOutletSchema), outletController.update);
router.delete('/:id', authorize('ADMIN', 'MANAJER_OPERASIONAL'), outletController.remove);

export default router;
