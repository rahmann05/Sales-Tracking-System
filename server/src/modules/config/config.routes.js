import express from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as configController from './config.controller.js';
import * as configSchema from './config.schema.js';

const router = express.Router();

router.use(authenticate);

// Get config by key
router.get('/:key', configController.getConfig);

// Upsert config by key (only ADMIN or MANAJER_OPERASIONAL)
router.put(
  '/:key',
  authorize('ADMIN', 'MANAJER_OPERASIONAL'),
  validate(configSchema.updateConfigSchema),
  configController.updateConfig
);

export default router;
