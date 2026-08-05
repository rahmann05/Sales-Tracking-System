import { Router } from 'express';
import * as reportController from './reports.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'MANAJER_OPERASIONAL', 'SUPERVISOR'));

router.get('/dashboard', reportController.getDashboard);
router.get('/sales', reportController.getSalesReport);
router.get('/outlets', reportController.getOutletReport);

export default router;
