/**
 * roles.routes.js
 * Single Responsibility: API routes for dynamic roles and permission templates.
 */

import { Router } from 'express';
import {authorizeDomainAction} from '../../middlewares/domain-permission.middleware.js';
import * as rolesController from './roles.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use((req,res,next)=>!['GET','HEAD','OPTIONS'].includes(req.method)?authorizeDomainAction('ROLES')(req,res,next):next());

// List all permissions metadata (public to authenticated users)
router.get('/permissions', rolesController.getAllPermissions);

// Roles management endpoints (Admin only)
router.get('/', rolesController.getAllRoles);
router.get('/:code', rolesController.getRoleByCode);
router.post('/', authorize('ADMIN'), rolesController.createRole);
router.put('/:code', authorize('ADMIN'), rolesController.updateRole);
router.delete('/:code', authorize('ADMIN'), rolesController.deleteRole);

export default router;
