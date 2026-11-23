import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { BUILT_IN_ROLES, ALL_PERMISSIONS } from './roles.constants.js';
const codes = new Set(BUILT_IN_ROLES.map((r) => r.code));
const builtInByCode = new Map(BUILT_IN_ROLES.map((r) => [r.code, r]));

const ROLE_CACHE_TTL_MS = 5000;
let roleCache = null;
let roleLastFetch = 0;
let roleEpoch = 0;
let rolePending = null;

export const invalidateRoleDefinitionsCache = () => {
  roleEpoch++;
  roleCache = null;
  roleLastFetch = 0;
  rolePending = null;
};

export async function getRoleDefinitions({ fresh = false } = {}) {
  const revision = roleEpoch;
  if (!fresh && roleCache && Date.now() - roleLastFetch <= ROLE_CACHE_TTL_MS) {
    return roleCache;
  }
  if (!rolePending || (fresh && !rolePending.fresh)) {
    const flight = prisma.systemConfig
      .findUnique({ where: { key: 'ROLE_DEFINITIONS' } })
      .then((row) => {
        const list = Array.isArray(row?.value) ? row.value : [];
        if (revision === roleEpoch) {
          roleCache = list;
          roleLastFetch = Date.now();
        }
        return list;
      });
    const holder = { fresh, flight };
    rolePending = holder;
    flight
      .finally(() => {
        if (rolePending === holder) rolePending = null;
      })
      .catch(() => {});
  }
  const result = await rolePending.flight;
  return revision === roleEpoch ? result : getRoleDefinitions({ fresh });
}

export async function roleDefinition(code, options = {}) {
  const opts = options && typeof options === 'object' ? options : {};
  let list = Array.isArray(opts.definitions)
    ? opts.definitions
    : await getRoleDefinitions({ fresh: Boolean(opts.fresh) });
  let role = list.find((r) => r.code === code) || builtInByCode.get(code);
  if (!role && !opts.fresh && !Array.isArray(opts.definitions)) {
    list = await getRoleDefinitions({ fresh: true });
    role = list.find((r) => r.code === code) || builtInByCode.get(code);
  }
  if (!role) throw new AppError('Definisi role tidak ditemukan', 400);
  const baseRole = role.isSystem ? role.code : role.baseRole || 'SALES';
  if (!codes.has(baseRole)) throw new AppError('Role dasar tidak valid', 400);
  return {
    ...role,
    baseRole,
    defaultPermissions: {
      ...(role.isSystem ? builtInByCode.get(role.code)?.defaultPermissions : {}),
      ...role.defaultPermissions,
    },
  };
}

export async function resolveIdentity(user, options = {}) {
  const opts = options && typeof options === 'object' ? options : {};
  const definition = await roleDefinition(user.roleCode || user.role, {
    definitions: opts.definitions,
    fresh: opts.fresh,
  });
  return {
    ...user,
    role: definition.baseRole,
    roleCode: definition.code,
    roleLabel: definition.name,
    permissions: { ...definition.defaultPermissions, ...(user.permissions || {}) },
  };
}

export async function userAssignment(data, current = null) {
  const safe = Object.fromEntries(
    ['name', 'email', 'password', 'clusterId', 'permissions']
      .filter((k) => data[k] !== undefined)
      .map((k) => [k, data[k]])
  );
  if (safe.permissions) {
    const allowed = new Set(ALL_PERMISSIONS.map((p) => p.key));
    if (
      Object.entries(safe.permissions).some(([k, v]) => !allowed.has(k) || typeof v !== 'boolean')
    )
      throw new AppError('Hak akses tidak valid', 400);
  }
  if (data.role !== undefined) {
    const role = await roleDefinition(String(data.role).trim().toUpperCase(), { fresh: true });
    safe.role = role.baseRole;
    safe.roleCode = role.isSystem ? null : role.code;
  }
  if (
    (safe.role || current?.role) === 'SALES' &&
    safe.clusterId &&
    safe.clusterId !== current?.clusterId
  )
    throw new AppError('Tetapkan tim dan wilayah sales melalui menu Tim, wilayah, dan PJP', 400);
  if (
    safe.clusterId &&
    !(await prisma.cluster.findFirst({
      where: { id: safe.clusterId, deletedAt: null },
      select: { id: true },
    }))
  )
    throw new AppError('Klaster aktif tidak ditemukan', 400);
  return safe;
}
