import { Router } from 'express';
import * as routeChangeController from './route-change.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { reportClosedSchema, rerouteSchema, skipSchema } from './route-change.schema.js';
import {assignRouteReview,routeReviewAssignmentOptions} from './services/route-review-assignment.service.js';
import {routeReplacementOptions} from './services/route-review-scope.service.js';

const router = Router();

router.use(authenticate);
const run=fn=>async(req,res,next)=>{try{res.set('Cache-Control','no-store').json({data:await fn(req)});}catch(error){next(error);}};
router.get('/:id/replacements',authorize('SUPERVISOR','ADMIN'),run(req=>routeReplacementOptions(req.params.id,req.query,req.user)));
router.get('/:id/assignment',authorize('ADMIN'),run(req=>routeReviewAssignmentOptions(req.params.id,req.user)));
router.put('/:id/assignment',authorize('ADMIN'),run(req=>assignRouteReview(req.params.id,req.body,req.user)));

router.post('/', authorize('SALES'), validate(reportClosedSchema), routeChangeController.reportClosed);
router.post('/:id/reroute', authorize('SUPERVISOR','ADMIN'), validate(rerouteSchema), routeChangeController.reroute);
router.post('/:id/skip', authorize('SUPERVISOR','ADMIN'), validate(skipSchema), routeChangeController.skip);
router.patch('/:id/approve', authorize('SUPERVISOR', 'ADMIN'), routeChangeController.approve);
router.patch('/:id/reject', authorize('SUPERVISOR', 'ADMIN'), routeChangeController.reject);
router.get('/', authorize('SUPERVISOR', 'ADMIN', 'SALES'), routeChangeController.getAll);

export default router;
