import { getRoleDefinitions, resolveIdentity } from '../../roles/role-assignment.service.js';
/** loginUser - single-responsibility service (extracted from auth.service.js). */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../config/prisma.js';
import { config } from '../../../config/index.js';
import { AppError } from '../../../utils/errors.js';
import { effectivePolicy, policyProfiles } from '../../config/services/policy-resolver.service.js';
import { warmDynamicConfig } from '../../config/services/dynamic-config.service.js';

const LOGIN_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  password: true,
  role: true,
  roleCode: true,
  clusterId: true,
  supervisorId: true,
  permissions: true,
  deletedAt: true,
  tokenVersion: true,
};

export const loginUser = async (rawEmail, password) => {
  const email = String(rawEmail || '')
    .trim()
    .toLowerCase();
  const [exactUser, definitions, profiles] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: LOGIN_USER_SELECT }),
    getRoleDefinitions(),
    policyProfiles(),
    warmDynamicConfig(),
  ]);
  const user =
    exactUser ||
    (await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: LOGIN_USER_SELECT,
    }));

  if (!user || user.deletedAt) {
    throw new AppError('Email atau password salah', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Email atau password salah', 401);
  }

  const identity = await resolveIdentity(user, { definitions });
  const payload = {
    id: user.id,
    tokenVersion: user.tokenVersion || 0,
    name: user.name,
    email: user.email,
    role: identity.role,
    roleCode: identity.roleCode,
    roleLabel: identity.roleLabel,
    clusterId: user.clusterId,
    permissions: identity.permissions,
  };

  const policy = await effectivePolicy({}, Date.now(), { profiles });
  const jwtExpiresIn = policy.values.JWT_EXPIRES_IN ?? config.jwtExpiresIn;
  const jwtRefreshExpiresIn =
    policy.values.JWT_REFRESH_EXPIRES_IN ?? config.jwtRefreshExpiresIn;

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: jwtExpiresIn,
  });

  const refreshToken = jwt.sign(
    { id: user.id, tokenVersion: user.tokenVersion || 0 },
    config.jwtRefreshSecret,
    {
      expiresIn: jwtRefreshExpiresIn,
    }
  );

  return {
    user: payload,
    accessToken,
    refreshToken,
  };
};
