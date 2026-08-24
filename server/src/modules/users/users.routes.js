import { Router } from 'express';
import * as userController from './users.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema } from './users.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAJER_OPERASIONAL', 'SUPERVISOR', 'SALES'), userController.getAllUsers);
router.get('/:id', userController.getUser);
router.post('/', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(createUserSchema), userController.create);
router.patch('/:id', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(updateUserSchema), userController.update);
router.delete('/:id', authorize('ADMIN', 'MANAJER_OPERASIONAL'), userController.remove);

export default router;
