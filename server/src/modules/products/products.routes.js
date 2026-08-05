import { Router } from 'express';
import * as productController from './products.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createProductSchema, updateProductSchema } from './products.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(createProductSchema), productController.create);
router.patch('/:id', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(updateProductSchema), productController.update);
router.delete('/:id', authorize('ADMIN', 'MANAJER_OPERASIONAL'), productController.remove);

export default router;
