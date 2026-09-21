import { Router } from 'express';
import * as userController from './users.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema } from './users.schema.js';

const router = Router();

router.use(authenticate);

// Real-time GPS Location Tracking
router.post('/location', userController.updateLocation);
router.get('/live-locations', authorize('ADMIN', 'SUPERVISOR', 'SALES'), userController.getLiveLocations);

// User CRUD
router.get('/', authorize('ADMIN', 'SUPERVISOR', 'SALES'), userController.getAllUsers);
router.get('/:id', userController.getUser);
router.post('/', authorize('ADMIN', 'SUPERVISOR'), validate(createUserSchema), userController.create);
router.patch('/:id', authorize('ADMIN', 'SUPERVISOR'), validate(updateUserSchema), userController.update);
router.delete('/:id', authorize('ADMIN', 'SUPERVISOR'), userController.remove);

export default router;
