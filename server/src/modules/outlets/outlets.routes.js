import { Router } from 'express';
import * as outletController from './outlets.controller.js';
import {
  handleLockOutlet,
  handleUnlockOutletDirect,
  handleRequestUnlock,
  handleApproveOrRejectUnlock,
  handleGetUnlockRequests,
} from './outlet-lock.controller.js';
import * as validationController from './outlet-validation.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createOutletSchema, updateOutletSchema, lockOutletSchema, unlockRequestSchema } from './outlets.schema.js';

const router = Router();

router.use(authenticate);

// ─── 1. Static Sub-Resources (Must precede /:id) ─────────────────────────────
router.get(
  '/validation-summary',
  authorize('ADMIN', 'SUPERVISOR'),
  validationController.getValidationSummary
);
router.post(
  '/batch-validate',
  authorize('ADMIN', 'SUPERVISOR'),
  validationController.batchValidate
);
router.get(
  '/unlock-requests',
  authorize('SUPERVISOR', 'ADMIN', 'SALES'),
  handleGetUnlockRequests
);
router.patch(
  '/unlock-requests/:requestId',
  authorize('SUPERVISOR', 'ADMIN'),
  handleApproveOrRejectUnlock
);

// ─── 2. Root Collection CRUD ─────────────────────────────────────────────────
router.get('/', outletController.getAll);
router.post('/', authorize('ADMIN', 'SUPERVISOR'), validate(createOutletSchema), outletController.create);

// ─── 3. Member Sub-Actions (/:id/...) ────────────────────────────────────────
router.post(
  '/:id/validate',
  authorize('ADMIN', 'SUPERVISOR'),
  validationController.validateSingle
);
router.post(
  '/:id/validate-nearby',
  authorize('ADMIN', 'SUPERVISOR'),
  validationController.validateNearby
);
router.post(
  '/:id/lock',
  authorize('ADMIN', 'SUPERVISOR'),
  validate(lockOutletSchema),
  handleLockOutlet
);
router.post(
  '/:id/unlock',
  authorize('ADMIN', 'SUPERVISOR'),
  validate(lockOutletSchema),
  handleUnlockOutletDirect
);
router.post(
  '/:id/unlock-request',
  authorize('SALES'),
  validate(unlockRequestSchema),
  handleRequestUnlock
);

// ─── 4. Member CRUD (/:id) ───────────────────────────────────────────────────
router.get('/:id', outletController.getById);
router.patch('/:id', authorize('ADMIN', 'SUPERVISOR'), validate(updateOutletSchema), outletController.update);
router.delete('/:id', authorize('ADMIN', 'SUPERVISOR'), outletController.remove);

export default router;
