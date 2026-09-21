import { Router } from 'express';
import * as vehicleController from './vehicles.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicleById);

// Hanya supervisor atau admin yang bisa manage vehicle
router.post('/', authorize('ADMIN', 'SUPERVISOR'), vehicleController.createVehicle);
router.put('/:id', authorize('ADMIN', 'SUPERVISOR'), vehicleController.updateVehicle);
router.delete('/:id', authorize('ADMIN', 'SUPERVISOR'), vehicleController.deleteVehicle);
router.post('/:id/maintenance', authorize('ADMIN', 'SUPERVISOR'), vehicleController.recordMaintenance);

export default router;
