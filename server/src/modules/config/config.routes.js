import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { CONFIG_PARAMS } from '../../../../shared/config.mjs';
import { getDynamicConfig } from './config.service.js';
import * as configController from './config.controller.js';
import * as configSchema from './config.schema.js';
import {prisma} from '../../config/prisma.js';
import {parsePagination,buildPaginatedResponse} from '../../utils/pagination.js';
import policyRoutes from './policy.routes.js';

const router = express.Router();

router.use(authenticate);
router.use('/policies',policyRoutes);
router.get('/access/export',async(req,res,next)=>{
 try{
  const report=req.query.domain==='REPORTS';
  if(await getDynamicConfig('FEATURE_EXPORT_MODE','ACTIVE')!=='ACTIVE'||report&&!await getDynamicConfig('REPORT_EXPORT_ENABLED',true))return res.status(403).json({message:'Ekspor dan cetak dinonaktifkan dalam aturan operasional.'});
  if(report&&req.user.permissions?.can_export_reports===false)return res.status(403).json({message:'Akun tidak memiliki izin ekspor laporan.'});
  res.set('Cache-Control','no-store').json({data:{allowed:true}});
 }catch(error){next(error);}
});

// Get ALL configs (Admin only)
router.get('/', authorize('ADMIN'), configController.getAllConfigs);
router.get('/history',authorize('ADMIN'),async(req,res,next)=>{
  try{const {page,limit,skip,take}=parsePagination(req.query);const where={entityType:'SYSTEM_CONFIG',...(req.query.key?{entityId:String(req.query.key)}:{})};const [data,total]=await Promise.all([prisma.auditEvent.findMany({where,orderBy:[{createdAt:'desc'},{id:'desc'}],skip,take}),prisma.auditEvent.count({where})]);res.json({data:buildPaginatedResponse(data,total,page,limit)});}catch(e){next(e);}
});

// Get config by key
router.get('/runtime', async (req, res, next) => {
  try {
    const params = CONFIG_PARAMS.filter(p => !p.key.startsWith('JWT_') && !['BYPASS_GEOFENCE_EMAILS','MAPS_API_KEY'].includes(p.key));
    const data = Object.fromEntries(await Promise.all(params.map(async p => [p.key, await getDynamicConfig(p.key, p.defaultValue)])));
    const bypass = String(await getDynamicConfig('BYPASS_GEOFENCE_EMAILS','')).split(',').map(e=>e.trim().toLowerCase());
    data.ATTENDANCE_GEOFENCE_BYPASS_ALLOWED = bypass.includes(req.user.email?.toLowerCase());
    data.POLICY_VERSIONS=req.policy.versions;
    res.set('Cache-Control', 'no-store').json({ data });
  } catch (error) { next(error); }
});
router.get('/:key', (req, res, next) => {
  if (req.params.key.startsWith('_')) return res.status(403).json({message:'Parameter internal sistem'});
  if (['MAPS_API_KEY', 'BYPASS_GEOFENCE_EMAILS', 'JWT_EXPIRES_IN', 'JWT_REFRESH_EXPIRES_IN'].includes(req.params.key) && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Khusus admin' });
  next();
}, configController.getConfig);

// Bulk update configs (Admin only)
router.put(
  '/',
  authorize('ADMIN'),
  configController.bulkUpdateConfigs
);

// Upsert config by key (ADMIN only)
router.put(
  '/:key',
  authorize('ADMIN'),
  validate(configSchema.updateConfigSchema),
  configController.updateConfig
);

export default router;
