import { Router } from 'express';
import {authorizeDomainAction} from '../../middlewares/domain-permission.middleware.js';
import * as divisionsController from './divisions.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use((req,res,next)=>!['GET','HEAD','OPTIONS'].includes(req.method)?authorizeDomainAction('MANAGE_DIVISION')(req,res,next):next());

// Public read (semua user yang login bisa ambil daftar divisi)
router.get('/', divisionsController.listDivisions);

// Admin-only write operations
router.post('/', authorize('ADMIN'), divisionsController.createDivision);
router.patch('/:id', authorize('ADMIN'), divisionsController.updateDivision);
router.delete('/:id', authorize('ADMIN'), divisionsController.deleteDivision);

export default router;
