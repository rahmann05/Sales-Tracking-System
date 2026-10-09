import { listTemplates, saveTemplates } from './services/templates.service.js';
import planningRoutes from './planning.routes.js';
import {planDayStatus} from './services/plan-day-status.service.js';
import { Router } from 'express';
import * as pjpController from './pjp.controller.js';
import { authenticate, authorize, authorizeWithPermission } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use('/planning',planningRoutes);
router.get('/day-status',authorize('ADMIN','SUPERVISOR','SALES'),async(req,res,next)=>{try{res.json({success:true,data:await planDayStatus(req.query.date,req.user.role==='SALES'?req.user.id:req.query.userId,req.user)});}catch(e){next(e);}});

router.get('/templates', authorize('ADMIN','SUPERVISOR','SALES'), async (req,res,next) => { try {res.json({success:true,data:await listTemplates(req.user)});} catch(e) {next(e);} });
router.put('/templates', authorizeWithPermission(['ADMIN','SUPERVISOR'],'can_manage_rjp'), async (req,res,next) => { try {res.json({success:true,data:await saveTemplates(req.body.templates,req.user)});} catch(e) {next(e);} });
router.get('/today', pjpController.getTodayPjp);
router.get('/', authorize('SUPERVISOR', 'ADMIN', 'SALES'), pjpController.getAllPjps);
router.post('/generate', authorize('ADMIN'), pjpController.generatePjps);
router.get('/:id', pjpController.getPjpById);

export default router;
