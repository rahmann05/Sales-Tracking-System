import { Router } from 'express';
import * as reportController from './reports.controller.js';
import { authenticate, authorize, authorizeWithPermission } from '../../middlewares/auth.middleware.js';
import { ROLES } from '../../utils/constants.js';

const router = Router();

router.use(authenticate);

router.get(
  '/dashboard',
  authorizeWithPermission([ROLES.ADMIN,ROLES.SUPERVISOR],'can_view_reports'),
  reportController.getDashboard
);
router.get(
  '/sales',
  authorizeWithPermission([ROLES.ADMIN,ROLES.SUPERVISOR],'can_view_reports'),
  reportController.getSalesReport
);
router.get(
  '/outlets',
  authorizeWithPermission([ROLES.ADMIN,ROLES.SUPERVISOR],'can_view_reports'),
  reportController.getOutletReport
);

// ND6 Reports Suite: Weekly & Month-to-Date (MTD)
router.get(
  '/weekly',
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALES),
  reportController.getWeeklyReport
);
router.get(
  '/mtd',
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALES),
  reportController.getMtdReport
);

export default router;
