import { Router } from 'express';
import * as orderController from './orders.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createOrderSchema } from './orders.schema.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('SALES'), validate(createOrderSchema), orderController.create);
router.get('/', authorize('ADMIN', 'SUPERVISOR', 'MANAJER_OPERASIONAL', 'SALES'), orderController.getAll);
router.get('/:id', orderController.getById);
router.patch('/:id/approve', authorize('ADMIN'), orderController.approve);
router.patch('/:id/reject', authorize('ADMIN'), orderController.reject);

export default router;
