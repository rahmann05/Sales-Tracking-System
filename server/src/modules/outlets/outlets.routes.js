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

// ─── Validation ──────────────────────────────────────────────────────────────
router.get(
  '/validation-summary',
  authorize('ADMIN', 'MANAJER_OPERASIONAL'),
  validationController.getValidationSummary
);
router.post(
  '/:id/validate',
  authorize('ADMIN', 'MANAJER_OPERASIONAL'),
  validationController.validateSingle
);

// ─── CRUD ─────────────────────────────────────────────────────────────────────
router.get('/', outletController.getAll);
router.get('/:id', outletController.getById);
router.post('/', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(createOutletSchema), outletController.create);
router.patch('/:id', authorize('ADMIN', 'MANAJER_OPERASIONAL'), validate(updateOutletSchema), outletController.update);
router.delete('/:id', authorize('ADMIN', 'MANAJER_OPERASIONAL'), outletController.remove);

// ─── Lock / Unlock Management ──────────────────────────────────────────────────
router.get(
  '/unlock-requests',
  authorize('SUPERVISOR', 'ADMIN', 'MANAJER_OPERASIONAL'),
  handleGetUnlockRequests
);
router.post(
  '/:id/lock',
  authorize('ADMIN', 'SUPERVISOR', 'MANAJER_OPERASIONAL'),
  validate(lockOutletSchema),
  handleLockOutlet
);
router.post(
  '/:id/unlock',
  authorize('ADMIN', 'SUPERVISOR', 'MANAJER_OPERASIONAL'),
  validate(lockOutletSchema),
  handleUnlockOutletDirect
);
router.post(
  '/:id/unlock-request',
  authorize('SALES'),
  validate(unlockRequestSchema),
  handleRequestUnlock
);
router.patch(
  '/unlock-requests/:requestId',
  authorize('SUPERVISOR', 'ADMIN'),
  handleApproveOrRejectUnlock
);

export default router;

