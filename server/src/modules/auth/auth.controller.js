import {prisma} from '../../config/prisma.js';
import {getIo} from '../../config/socket.js';
import { loginUser, refreshAccessToken } from './auth.service.js';
import { successResponse } from '../../utils/response.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    return successResponse(res, 200, result, 'Login berhasil');
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await refreshAccessToken(refreshToken);
    return successResponse(res, 200, result, 'Access token diperbarui');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await prisma.user.updateMany({where:{id:req.user.id,tokenVersion:req.user.tokenVersion||0},data:{tokenVersion:{increment:1}}});
    getIo()?.in(`user:${req.user.id}`).disconnectSockets(true);
    return successResponse(res, 200, null, 'Logout berhasil; seluruh sesi akun telah dicabut');
  } catch (error) {
    next(error);
  }
};
