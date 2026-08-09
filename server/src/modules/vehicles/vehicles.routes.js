import { Router } from 'express';
import * as vehicleController from './vehicles.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicleById);

// Hanya operasional atau admin yang bisa manage vehicle
router.post('/', authorize('ADMIN', 'MANAJER_OPERASIONAL'), vehicleController.createVehicle);
router.put('/:id', authorize('ADMIN', 'MANAJER_OPERASIONAL'), vehicleController.updateVehicle);
router.delete('/:id', authorize('ADMIN', 'MANAJER_OPERASIONAL'), vehicleController.deleteVehicle);

export default router;
