import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { CONFIG_PARAMS } from '../../../../shared/config.mjs';
import { getDynamicConfig } from './config.service.js';
import * as configController from './config.controller.js';
import * as configSchema from './config.schema.js';

const router = express.Router();

router.use(authenticate);

// Get ALL configs (Admin only)
router.get('/', authorize('ADMIN'), configController.getAllConfigs);

// Get config by key
router.get('/runtime', async (req, res, next) => {
  try {
    const params = CONFIG_PARAMS.filter(p => !p.key.startsWith('JWT_') && !['BYPASS_GEOFENCE_EMAILS','MAPS_API_KEY'].includes(p.key));
    const data = Object.fromEntries(await Promise.all(params.map(async p => [p.key, await getDynamicConfig(p.key, p.defaultValue)])));
    const bypass = String(await getDynamicConfig('BYPASS_GEOFENCE_EMAILS','')).split(',').map(e=>e.trim().toLowerCase());
    data.ATTENDANCE_GEOFENCE_BYPASS_ALLOWED = bypass.includes(req.user.email?.toLowerCase());
    res.set('Cache-Control', 'no-store').json({ data });
  } catch (error) { next(error); }
});
router.get('/:key', (req, res, next) => {
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
