import { resolveIdentity } from '../../roles/role-assignment.service.js';
/** loginUser - single-responsibility service (extracted from auth.service.js). */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../config/prisma.js';
import { config } from '../../../config/index.js';
import { AppError } from '../../../utils/errors.js';
import { getDynamicConfig } from '../../config/config.service.js';


export const loginUser = async (rawEmail, password) => {
  const email = String(rawEmail || '').trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: 'insensitive' },
    },
  });

  if (!user || user.deletedAt) {
    throw new AppError('Email atau password salah', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Email atau password salah', 401);
  }

  const identity = await resolveIdentity(user);
  const payload = {
    id: user.id,
    tokenVersion:user.tokenVersion||0,
    name: user.name,
    email: user.email,
    role: identity.role,
    roleCode: identity.roleCode,
    roleLabel: identity.roleLabel,
    clusterId: user.clusterId,
    permissions: identity.permissions,
  };

  const jwtExpiresIn = await getDynamicConfig('JWT_EXPIRES_IN', config.jwtExpiresIn);
  const jwtRefreshExpiresIn = await getDynamicConfig('JWT_REFRESH_EXPIRES_IN', config.jwtRefreshExpiresIn);

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: jwtExpiresIn,
  });

  const refreshToken = jwt.sign({ id: user.id,tokenVersion:user.tokenVersion||0 }, config.jwtRefreshSecret, {
    expiresIn: jwtRefreshExpiresIn,
  });

  return {
    user: payload,
    accessToken,
    refreshToken,
  };
};
