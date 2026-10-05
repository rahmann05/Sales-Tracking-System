import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { memoryCacheMiddleware, invalidateCache } from '../../middlewares/cache.middleware.js';
import * as configController from './config.controller.js';
import * as configSchema from './config.schema.js';

const router = express.Router();

router.use(authenticate);

// Get ALL configs (Admin only)
router.get('/', authorize('ADMIN'), memoryCacheMiddleware(60), configController.getAllConfigs);

// Get config by key
router.get('/:key', memoryCacheMiddleware(60), configController.getConfig);

// Bulk update configs (Admin only)
router.put(
  '/',
  authorize('ADMIN'),
  configController.bulkUpdateConfigs
);

// Upsert config by key (only ADMIN or SUPERVISOR)
router.put(
  '/:key',
  authorize('ADMIN', 'SUPERVISOR'),
  validate(configSchema.updateConfigSchema),
  configController.updateConfig
);

export default router;
