import { Router } from 'express';
import * as absensiController from './absensi.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { checkInSchema, checkOutSchema } from './absensi.schema.js';

const router = Router();

router.use(authenticate);

router.post('/:pjpStopId/in', authorize('SALES', 'DRIVER', 'HELPER'), validate(checkInSchema), absensiController.checkIn);
router.post('/:pjpStopId/out', authorize('SALES', 'DRIVER', 'HELPER'), validate(checkOutSchema), absensiController.checkOut);
router.get('/history', absensiController.history);
router.get('/pjp/:pjpId', authorize('SUPERVISOR', 'MANAJER_OPERASIONAL', 'ADMIN'), absensiController.getPjpRecap);

export default router;
