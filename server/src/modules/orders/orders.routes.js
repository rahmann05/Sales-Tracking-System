import { Router } from 'express';
import * as orderController from './orders.controller.js';
import { authenticate, authorize, authorizeWithPermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createOrderSchema } from './orders.schema.js';

const router = Router();

router.use(authenticate);

router.post('/', authorizeWithPermission(['SALES'],'can_create_order'), validate(createOrderSchema), orderController.create);
router.get('/', authorize('ADMIN', 'SUPERVISOR', 'SALES'), orderController.getAll);
router.patch('/batch-approve', authorizeWithPermission(['ADMIN', 'SUPERVISOR'], 'can_approve_order'), orderController.batchApprove);
router.get('/:id', orderController.getById);
router.patch('/:id/approve', authorizeWithPermission(['ADMIN', 'SUPERVISOR'], 'can_approve_order'), orderController.approve);
router.patch('/:id/reject', authorizeWithPermission(['ADMIN', 'SUPERVISOR'], 'can_approve_order'), orderController.reject);

export default router;
