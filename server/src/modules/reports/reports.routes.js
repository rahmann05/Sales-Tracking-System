import {getDynamicConfig} from '../config/config.service.js';
import {AppError} from '../../utils/errors.js';
import { Router } from 'express';
import * as reportController from './reports.controller.js';
import { authenticate, authorize, authorizeWithPermission } from '../../middlewares/auth.middleware.js';
import { getSalesTarget, saveSalesTarget } from './services/sales-target.service.js';
import { getReportCalendar, saveReportCalendar } from './services/report-calendar.service.js';
import { createReportArchive, listReportArchives, getReportArchive } from './services/report-archive.service.js';
import { successResponse } from '../../utils/response.js';
import { ROLES } from '../../utils/constants.js';

const router = Router();

router.use(authenticate);
router.use(async(req,res,next)=>{try{const key=req.path==='/weekly'?'REPORT_WEEKLY_ENABLED':req.path==='/mtd'?'REPORT_MTD_ENABLED':req.path.startsWith('/archives')&&req.method==='POST'?'REPORT_ARCHIVE_ENABLED':null;if(key&&!await getDynamicConfig(key,true))throw new AppError('Keluaran laporan ini dinonaktifkan Admin',403);next();}catch(error){next(error);}});
router.get('/archives',authorize(ROLES.ADMIN),async(req,res,next)=>{
  try{return successResponse(res,200,await listReportArchives(req.query,req.user));}catch(error){next(error);}
});
router.get('/archives/:id',authorize(ROLES.ADMIN),async(req,res,next)=>{
  try{return successResponse(res,200,await getReportArchive(req.params.id,req.user));}catch(error){next(error);}
});
router.post('/archives',authorize(ROLES.ADMIN),async(req,res,next)=>{
  try{return successResponse(res,201,await createReportArchive(req.body,req.user));}catch(error){next(error);}
});
router.get('/calendar',authorize(ROLES.ADMIN),async(req,res,next)=>{
  try { return successResponse(res,200,await getReportCalendar(req.query,req.user)); } catch(error) { next(error); }
});
router.put('/calendar',authorize(ROLES.ADMIN),async(req,res,next)=>{
  try { return successResponse(res,200,await saveReportCalendar(req.body,req.user)); } catch(error) { next(error); }
});
router.get('/targets',authorize(ROLES.ADMIN),async(req,res,next)=>{
  try { return successResponse(res,200,await getSalesTarget(req.query,req.user)); } catch(error) { next(error); }
});
router.put('/targets',authorize(ROLES.ADMIN),async(req,res,next)=>{
  try { return successResponse(res,200,await saveSalesTarget(req.body,req.user)); } catch(error) { next(error); }
});

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
  authorizeWithPermission([ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALES], 'can_view_reports'),
  reportController.getWeeklyReport
);
router.get(
  '/mtd',
  authorizeWithPermission([ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALES], 'can_view_reports'),
  reportController.getMtdReport
);

export default router;
