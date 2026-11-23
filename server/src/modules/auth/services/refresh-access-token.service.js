/** refreshAccessToken - single-responsibility service (extracted from auth.service.js). */
import jwt from 'jsonwebtoken';
import { prisma } from '../../../config/prisma.js';
import { config } from '../../../config/index.js';
import { AppError } from '../../../utils/errors.js';
import { effectivePolicy, policyProfiles } from '../../config/services/policy-resolver.service.js';
import { warmDynamicConfig } from '../../config/services/dynamic-config.service.js';

const REFRESH_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  clusterId: true,
  deletedAt: true,
  tokenVersion: true,
};

export const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
    if (typeof decoded !== 'object' || typeof decoded.id !== 'string' || !decoded.id.trim())
      throw new AppError('Refresh token tidak valid', 401);
    const [user, profiles] = await Promise.all([
      prisma.user.findUnique({
        where: { id: decoded.id },
        select: REFRESH_USER_SELECT,
      }),
      policyProfiles(),
      warmDynamicConfig(),
    ]);

    if (!user || user.deletedAt) {
      throw new AppError('User tidak ditemukan', 401);
    }

    if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0))
      throw new AppError('Sesi telah dicabut. Masuk kembali.', 401);
    const payload = {
      tokenVersion: user.tokenVersion || 0,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clusterId: user.clusterId,
    };

    const policy = await effectivePolicy({}, Date.now(), { profiles });
    const jwtExpiresIn = policy.values.JWT_EXPIRES_IN ?? config.jwtExpiresIn;

    const newAccessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: jwtExpiresIn,
    });

    return { accessToken: newAccessToken };
  } catch (err) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(err.name))
      throw new AppError('Refresh token tidak valid atau telah kadaluwarsa', 401);
    throw err;
  }
};
