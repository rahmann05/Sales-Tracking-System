import * as userService from './users.service.js';
import { successResponse } from '../../utils/response.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers(req.query);
    return successResponse(res, 200, users);
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return successResponse(res, 200, user);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    return successResponse(res, 201, user, 'User berhasil dibuat');
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return successResponse(res, 200, user, 'User berhasil diperbarui');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    return successResponse(res, 200, null, 'User berhasil dihapus');
  } catch (error) {
    next(error);
  }
};

export const updateLocation = async (req, res, next) => {
  try {
    const result = await userService.updateSalesLocation(req.user.id, req.body);
    return successResponse(res, 200, result, 'Koordinat GPS berhasil diperbarui');
  } catch (error) {
    next(error);
  }
};

export const getLiveLocations = async (req, res, next) => {
  try {
    const locations = await userService.getLiveSalesLocations();
    return successResponse(res, 200, locations, 'Live lokasi sales berhasil diambil');
  } catch (error) {
    next(error);
  }
};
