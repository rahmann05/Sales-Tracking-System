import { asyncHandler } from '../../utils/asyncHandler.js';
import * as vehicleService from './vehicles.service.js';
import { createVehicleSchema, updateVehicleSchema } from './vehicles.schema.js';

export const getVehicles = asyncHandler(async (req, res) => {
  const vehicles = await vehicleService.getVehicles();
  res.json({
    status: 'success',
    data: vehicles,
  });
});

export const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.getVehicleById(req.params.id);
  res.json({
    status: 'success',
    data: vehicle,
  });
});

export const createVehicle = asyncHandler(async (req, res) => {
  const validated = createVehicleSchema.parse({ body: req.body });
  const vehicle = await vehicleService.createVehicle(validated.body);
  res.status(201).json({
    status: 'success',
    data: vehicle,
  });
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const validated = updateVehicleSchema.parse({ 
    body: req.body, 
    params: { id: req.params.id } 
  });
  const vehicle = await vehicleService.updateVehicle(validated.params.id, validated.body);
  res.json({
    status: 'success',
    data: vehicle,
  });
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  await vehicleService.deleteVehicle(req.params.id);
  res.json({
    status: 'success',
    message: 'Kendaraan berhasil dihapus',
  });
});
