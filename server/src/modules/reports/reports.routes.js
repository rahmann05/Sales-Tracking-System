import { Router } from 'express';
import * as reportController from './reports.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { ROLES } from '../../utils/constants.js';

const router = Router();

router.use(authenticate);

router.get(
  '/dashboard',
  authorize(ROLES.ADMIN, ROLES.MANAJER_OPERASIONAL, ROLES.SUPERVISOR),
  reportController.getDashboard
);
router.get(
  '/sales',
  authorize(ROLES.ADMIN, ROLES.MANAJER_OPERASIONAL, ROLES.SUPERVISOR),
  reportController.getSalesReport
);
router.get(
  '/outlets',
  authorize(ROLES.ADMIN, ROLES.MANAJER_OPERASIONAL, ROLES.SUPERVISOR),
  reportController.getOutletReport
);

// ND6 Reports Suite: Weekly & Month-to-Date (MTD)
router.get(
  '/weekly',
  authorize(ROLES.ADMIN, ROLES.MANAJER_OPERASIONAL, ROLES.SUPERVISOR, ROLES.SALES),
  reportController.getWeeklyReport
);
router.get(
  '/mtd',
  authorize(ROLES.ADMIN, ROLES.MANAJER_OPERASIONAL, ROLES.SUPERVISOR, ROLES.SALES),
  reportController.getMtdReport
);

export default router;
