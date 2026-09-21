import { Router } from 'express';
import * as divisionsController from './divisions.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Public read (semua user yang login bisa ambil daftar divisi)
router.get('/', divisionsController.listDivisions);

// Admin-only write operations
router.post('/', authorize('ADMIN'), divisionsController.createDivision);
router.patch('/:id', authorize('ADMIN'), divisionsController.updateDivision);
router.delete('/:id', authorize('ADMIN'), divisionsController.deleteDivision);

export default router;
