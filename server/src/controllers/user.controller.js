import { fetchAllUsers, fetchUserById } from '../services/user.service.js';
import { successResponse } from '../utils/response.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await fetchAllUsers();
    return successResponse(res, 200, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await fetchUserById(id);
    return successResponse(res, 200, 'User details retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};
