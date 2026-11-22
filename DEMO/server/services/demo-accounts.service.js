import { createRequire } from 'node:module';
import { prisma } from '../../../server/src/config/prisma.js';
import { config } from '../../../server/src/config/index.js';
import { resolveIdentity } from '../../../server/src/modules/roles/role-assignment.service.js';
import { getDynamicConfig } from '../../../server/src/modules/config/config.service.js';
import { AppError } from '../../../server/src/utils/errors.js';

const require = createRequire(new URL('../../../server/package.json', import.meta.url));
const jwt = require('jsonwebtoken');

const ROLE_SORT_ORDER = {
  ADMIN: 1,
  SUPERVISOR: 2,
  SALES: 3,
  KEPALA_GUDANG: 4,
  SUPIR: 5,
};

export async function listDemoAccounts(db = prisma) {
  const users = await db.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      code: true,
      name: true,
      email: true,
      role: true,
      roleCode: true,
      clusterId: true,
      supervisorId: true,
      cluster: { select: { id: true, name: true } },
      supervisor: { select: { id: true, name: true } },
    },
  });

  return users.sort((a, b) => {
    const rankDiff = (ROLE_SORT_ORDER[a.role] || 99) - (ROLE_SORT_ORDER[b.role] || 99);
    if (rankDiff !== 0) return rankDiff;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

/**
 * Issues a genuine JWT pair using the target user's real identity & permissions (no RBAC bypass).
 */
export async function issueDemoSwitchSession(
  userId,
  {
    db = prisma,
    resolveUser = resolveIdentity,
    sign = jwt.sign,
    readConfig = getDynamicConfig,
  } = {}
) {
  if (!userId || typeof userId !== 'string') {
    throw new AppError('userId akun demo wajib dipilih', 400);
  }
  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      roleCode: true,
      clusterId: true,
      permissions: true,
      tokenVersion: true,
    },
  });
  if (!user) {
    throw new AppError('Akun pengguna aktif tidak ditemukan', 404);
  }

  const identity = await resolveUser(user);
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

  const jwtExpiresIn = await readConfig('JWT_EXPIRES_IN', config.jwtExpiresIn);
  const jwtRefreshExpiresIn = await readConfig(
    'JWT_REFRESH_EXPIRES_IN',
    config.jwtRefreshExpiresIn
  );

  const accessToken = sign(payload, config.jwtSecret, { expiresIn: jwtExpiresIn });
  const refreshToken = sign(
    { id: user.id, tokenVersion: user.tokenVersion || 0 },
    config.jwtRefreshSecret,
    { expiresIn: jwtRefreshExpiresIn }
  );

  return { user: payload, accessToken, refreshToken };
}
