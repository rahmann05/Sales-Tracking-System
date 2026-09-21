/** refreshAccessToken - single-responsibility service (extracted from auth.service.js). */
import jwt from 'jsonwebtoken';
import { prisma } from '../../../config/prisma.js';
import { config } from '../../../config/index.js';
import { AppError } from '../../../utils/errors.js';


export const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.deletedAt) {
      throw new AppError('User tidak ditemukan', 401);
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clusterId: user.clusterId,
    };

    const newAccessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    return { accessToken: newAccessToken };
  } catch (err) {
    throw new AppError('Refresh token tidak valid atau telah kadaluwarsa', 401);
  }
};
