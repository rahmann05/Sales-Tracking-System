import {outletFieldVisitReport} from './services/outlet-field-report.service.js';
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
import {outletDirectory,outletProfile} from './services/outlet-directory.service.js';
import {openOutletReview,getOutletReviews,getOutletReview,decideOutletReview} from './services/outlet-reviews.service.js';
import {changeOutletActivation} from './services/outlet-activation.service.js';
import {duplicateOutlets} from './services/outlet-duplicates.service.js';
import {prisma} from '../../config/prisma.js';
import {AppError} from '../../utils/errors.js';

import {assignOutletReview} from './services/outlet-review-assignment.service.js';
import {decideDigitalOutlet} from './services/outlet-digital-decision.service.js';
import {assignOutletField,listOutletFieldTasks,getOutletFieldTask,actOutletField} from './services/outlet-field-task.service.js';
import {startValidationJob,validationJobs,changeValidationJob} from './services/outlet-validation-job.service.js';
const router = Router();

router.use(authenticate);
router.param('id',async(req,res,next,id)=>{try{if(['ADMIN','KEPALA_GUDANG','SUPIR'].includes(req.user.role)||req.path.endsWith('/profile')||req.path.endsWith('/reactivate'))return next();await assertOutletAccess(req.user,id);next();}catch(e){next(e);}});

const action=fn=>async(req,res,next)=>{try{res.json({status:'success',data:await fn(req)});}catch(error){next(error);}};
router.get('/field-visit-report',async(req,res,next)=>{try{res.json({status:'success',...await outletFieldVisitReport(req.query,req.user)});}catch(e){next(e);}});
router.get('/field-tasks',action(req=>listOutletFieldTasks(req.user,req.query.status)));
router.get('/field-tasks/:taskId',action(req=>getOutletFieldTask(req.params.taskId,req.user)));
router.patch('/field-tasks/:taskId',action(req=>actOutletField(req.params.taskId,req.body,req.user)));
router.get('/validation-jobs',action(req=>validationJobs(req.user)));
router.post('/validation-jobs',action(req=>startValidationJob(req.body,req.user)));
router.patch('/validation-jobs/:jobId',action(req=>changeValidationJob(req.params.jobId,req.body,req.user)));
router.patch('/:id/reviews/:reviewId/digital',action(req=>decideDigitalOutlet(req.params.id,req.params.reviewId,req.body,req.user)));
router.post('/:id/reviews/:reviewId/field-task',action(req=>assignOutletField(req.params.id,req.params.reviewId,req.body,req.user)));
const directoryAccess=(req,res,next)=>{if(['ADMIN','SUPERVISOR'].includes(req.user.role)&&req.user.permissions?.can_manage_outlets!==false||req.user.permissions?.can_manage_outlets||req.user.permissions?.can_validate_outlet)return next();next(new AppError('Akses direktori ditolak',403));};
router.get('/directory',directoryAccess,async(req,res,next)=>{try{res.json({status:'success',...await outletDirectory(req.query,req.user)});}catch(e){next(e);}});
router.get('/reviews',authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_validate_outlet'),async(req,res,next)=>{try{res.json({status:'success',...await getOutletReviews(req.query,req.user)});}catch(e){next(e);}});
router.get('/reviews/:reviewId',authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_validate_outlet'),action(req=>getOutletReview(req.params.reviewId,req.user)));
router.post('/duplicates',authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_outlets'),validate(createOutletSchema),action(req=>duplicateOutlets(prisma,req.body,req.user)));

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

router.patch('/:id/coordinates',directoryAccess,async(req,res,next)=>{try{res.json({data:await correctCoordinates(req.params.id,req.body,req.user)});}catch(e){next(e);}});
router.get('/:id/profile',authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_outlets'),action(req=>outletProfile(req.params.id,req.user)));
router.patch('/:id/reviews/:reviewId/assignment',authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_validate_outlet'),action(req=>assignOutletReview(req.params.id,req.params.reviewId,req.body,req.user)));
router.post('/:id/reviews',authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_validate_outlet'),action(req=>openOutletReview(req.params.id,req.body,req.user)));
router.patch('/:id/reviews/:reviewId',authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_validate_outlet'),action(req=>decideOutletReview(req.params.id,req.params.reviewId,req.body,req.user)));
router.post('/:id/reactivate',authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_outlets'),action(req=>changeOutletActivation(req.params.id,req.body,req.user,true)));

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
router.delete('/:id', authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_outlets'),action(req=>changeOutletActivation(req.params.id,req.body,req.user,false)));

export default router;
