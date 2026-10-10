import { Router } from 'express';
import {authorizeDomainAction} from '../../middlewares/domain-permission.middleware.js';
import * as productController from './products.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { memoryCacheMiddleware } from "../../middlewares/cache.middleware.js";
import { createProductSchema, updateProductSchema } from './products.schema.js';

const router = Router();

router.use(authenticate);
router.use((req,res,next)=>!['GET','HEAD','OPTIONS'].includes(req.method)?authorizeDomainAction(req.method==='POST'?'CREATE_PRODUCT':'MANAGE_PRODUCT')(req,res,next):next());

router.get('/', memoryCacheMiddleware(60), productController.getAll);
router.get('/:id', memoryCacheMiddleware(60), productController.getById);
router.post('/', authorize('ADMIN', 'SALES'), validate(createProductSchema), productController.create);
router.patch('/:id', authorize('ADMIN'), validate(updateProductSchema), productController.update);
router.delete('/:id', authorize('ADMIN'), productController.remove);

export default router;
