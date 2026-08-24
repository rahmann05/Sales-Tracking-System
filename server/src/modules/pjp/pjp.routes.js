import { Router } from 'express';
import * as pjpController from './pjp.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateStopSchema } from './pjp.schema.js';

const router = Router();

router.use(authenticate);

router.get('/today', pjpController.getTodayPjp);
router.get('/', authorize('SUPERVISOR', 'MANAJER_OPERASIONAL', 'ADMIN', 'SALES'), pjpController.getAllPjps);
router.post('/generate', pjpController.generatePjps);
router.get('/:id', pjpController.getPjpById);
router.patch('/:id/stops/:stopId', authorize('MANAJER_OPERASIONAL', 'ADMIN'), validate(updateStopSchema), pjpController.updateStop);

export default router;
