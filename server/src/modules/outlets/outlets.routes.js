import { correctCoordinates } from './services/correct-coordinates.service.js';
import {assertOutletAccess} from '../../utils/team-scope.js';
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
import { authenticate, authorize, authorizeWithPermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createOutletSchema, updateOutletSchema, lockOutletSchema, unlockRequestSchema } from './outlets.schema.js';

const router = Router();

router.use(authenticate);
router.param('id',async(req,res,next,id)=>{try{if(['ADMIN','KEPALA_GUDANG','SUPIR'].includes(req.user.role))return next();await assertOutletAccess(req.user,id);next();}catch(e){next(e);}});

// ─── 1. Static Sub-Resources (Must precede /:id) ─────────────────────────────
router.get(
  '/validation-summary',
  authorizeWithPermission(['ADMIN', 'SUPERVISOR'], 'can_validate_outlet'),
  validationController.getValidationSummary
);
router.post(
  '/batch-validate',
  authorizeWithPermission(['ADMIN', 'SUPERVISOR'], 'can_validate_outlet'),
  validationController.batchValidate
);
router.get(
  '/unlock-requests',
  authorize('SUPERVISOR', 'ADMIN', 'SALES'),
  handleGetUnlockRequests
);
router.patch(
  '/unlock-requests/:requestId',
  authorizeWithPermission(['SUPERVISOR', 'ADMIN'], 'can_unlock_absensi'),
  handleApproveOrRejectUnlock
);

// ─── 2. Root Collection CRUD ─────────────────────────────────────────────────
router.get('/', outletController.getAll);
router.post('/', authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_outlets'), validate(createOutletSchema), outletController.create);

router.patch('/:id/coordinates',authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_validate_outlet'),async(req,res,next)=>{try{res.json({data:await correctCoordinates(req.params.id,req.body,req.user)});}catch(e){next(e);}});

// ─── 3. Member Sub-Actions (/:id/...) ────────────────────────────────────────
router.post(
  '/:id/validate',
  authorizeWithPermission(['ADMIN', 'SUPERVISOR'], 'can_validate_outlet'),
  validationController.validateSingle
);
router.post(
  '/:id/validate-nearby',
  authorizeWithPermission(['ADMIN', 'SUPERVISOR'], 'can_validate_outlet'),
  validationController.validateNearby
);
router.post(
  '/:id/lock',
  authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_unlock_absensi'),
  validate(lockOutletSchema),
  handleLockOutlet
);
router.post(
  '/:id/unlock',
  authorizeWithPermission(['ADMIN', 'SUPERVISOR'], 'can_unlock_absensi'),
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
router.patch('/:id', authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_outlets'), validate(updateOutletSchema), outletController.update);
router.delete('/:id', authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_outlets'), outletController.remove);

export default router;
