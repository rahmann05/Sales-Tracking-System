import { Router } from 'express';
import * as routeChangeController from './route-change.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { reportClosedSchema, rerouteSchema, skipSchema } from './route-change.schema.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('SALES'), validate(reportClosedSchema), routeChangeController.reportClosed);
router.post('/:id/reroute', authorize('SUPERVISOR'), validate(rerouteSchema), routeChangeController.reroute);
router.post('/:id/skip', authorize('SUPERVISOR'), validate(skipSchema), routeChangeController.skip);
router.patch('/:id/approve', authorize('SUPERVISOR', 'ADMIN'), routeChangeController.approve);
router.patch('/:id/reject', authorize('SUPERVISOR', 'ADMIN'), routeChangeController.reject);
router.get('/', authorize('SUPERVISOR', 'ADMIN'), routeChangeController.getAll);

export default router;
