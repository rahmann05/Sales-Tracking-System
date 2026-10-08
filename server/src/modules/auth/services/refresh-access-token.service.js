/** refreshAccessToken - single-responsibility service (extracted from auth.service.js). */
import jwt from 'jsonwebtoken';
import { prisma } from '../../../config/prisma.js';
import { config } from '../../../config/index.js';
import { AppError } from '../../../utils/errors.js';
import { getDynamicConfig } from '../../config/config.service.js';

export const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
    if(typeof decoded !== 'object' || typeof decoded.id !== 'string' || !decoded.id.trim())throw new AppError('Refresh token tidak valid',401);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.deletedAt) {
      throw new AppError('User tidak ditemukan', 401);
    }

    if((decoded.tokenVersion||0)!==(user.tokenVersion||0))throw new AppError('Sesi telah dicabut. Masuk kembali.',401);
    const payload = {
      tokenVersion:user.tokenVersion||0,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clusterId: user.clusterId,
    };

    const jwtExpiresIn = await getDynamicConfig('JWT_EXPIRES_IN', config.jwtExpiresIn);

    const newAccessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: jwtExpiresIn,
    });

    return { accessToken: newAccessToken };
  } catch (err) {
    if(['JsonWebTokenError','TokenExpiredError','NotBeforeError'].includes(err.name))throw new AppError('Refresh token tidak valid atau telah kadaluwarsa', 401);
    throw err;
  }
};
