import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import * as controller from './daily-calls.controller.js';
import { ROLES } from '../../utils/constants.js';

const router = Router();

router.use(authenticate);

// Accessible by Supervisor and Admin (and Sales for personal tracking)
router.get(
  '/',
  authorize(ROLES.SALES, ROLES.SUPERVISOR, ROLES.ADMIN),
  controller.getDailyCalls
);

export default router;

