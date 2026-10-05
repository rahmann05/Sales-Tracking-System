/**
 * roles.routes.js
 * Single Responsibility: API routes for dynamic roles and permission templates.
 */

import { Router } from 'express';
import * as rolesController from './roles.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// List all permissions metadata (public to authenticated users)
router.get('/permissions', rolesController.getAllPermissions);

// Roles management endpoints (Admin only)
router.get('/', rolesController.getAllRoles);
router.get('/:code', rolesController.getRoleByCode);
router.post('/', authorize('ADMIN'), rolesController.createRole);
router.put('/:code', authorize('ADMIN'), rolesController.updateRole);
router.delete('/:code', authorize('ADMIN'), rolesController.deleteRole);

export default router;
