import { Router } from 'express';
import {authorizeDomainAction} from '../../middlewares/domain-permission.middleware.js';
import * as userController from './users.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema, updatePasswordSchema, updatePermissionsSchema,salesLocationSchema } from './users.schema.js';

const router = Router();

router.use(authenticate);
router.use((req,res,next)=>!['GET','HEAD','OPTIONS'].includes(req.method)&&req.path!=='/location'?authorizeDomainAction('USERS')(req,res,next):next());

// Real-time GPS Location Tracking
router.post('/location',authorize('SALES'),validate(salesLocationSchema),userController.updateLocation);
router.get('/live-locations', authorize('ADMIN', 'SUPERVISOR', 'SALES'), userController.getLiveLocations);

// User CRUD
router.get('/', authorize('ADMIN', 'SUPERVISOR', 'SALES', 'KEPALA_GUDANG'), userController.getAllUsers);
router.get('/:id', userController.getUser);
router.post('/', authorize('ADMIN'), validate(createUserSchema), userController.create);
router.patch('/:id', authorize('ADMIN'), validate(updateUserSchema), userController.update);
router.put('/:id/password', authorize('ADMIN'), validate(updatePasswordSchema), userController.updatePassword);
router.put('/:id/permissions', authorize('ADMIN'), validate(updatePermissionsSchema), userController.updatePermissions);
router.delete('/:id', authorize('ADMIN'), userController.remove);

export default router;
