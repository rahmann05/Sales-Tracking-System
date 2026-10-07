/**
 * roles.service.js
 * Single Responsibility: Business logic for managing dynamic roles and their permission templates.
 */

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { BUILT_IN_ROLES, ALL_PERMISSIONS, getEmptyPermissions } from './roles.constants.js';

function validatedPermissions(value = {}) {
  const keys=new Set(ALL_PERMISSIONS.map(p=>p.key));
  if(!value || typeof value!=='object' || Array.isArray(value) || Object.entries(value).some(([k,v])=>!keys.has(k)||typeof v!=='boolean')) throw new AppError('Template hak akses tidak valid',400);
  return {...getEmptyPermissions(),...value};
}

const CONFIG_KEY = 'ROLE_DEFINITIONS';

/**
 * Fetch all role definitions from SystemConfig, initializing built-in roles if missing.
 */
export const getAllRoles = async () => {
  let configEntry = await prisma.systemConfig.findUnique({
    where: { key: CONFIG_KEY },
  });

  let rolesList = [];
  if (!configEntry || !Array.isArray(configEntry.value) || configEntry.value.length === 0) {
    // Initialize with built-in roles
    rolesList = [...BUILT_IN_ROLES];
    await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      create: { key: CONFIG_KEY, value: rolesList },
      update: { value: rolesList },
    });
  } else {
    rolesList = configEntry.value;

    // Ensure all built-in roles are present in the list
    const existingCodes = new Set(rolesList.map((r) => r.code));
    let hasAdditions = false;
    for (const builtIn of BUILT_IN_ROLES) {
      if (!existingCodes.has(builtIn.code)) {
        rolesList.push(builtIn);
        hasAdditions = true;
      }
    }
    if (hasAdditions) {
      await prisma.systemConfig.update({
        where: { key: CONFIG_KEY },
        data: { value: rolesList },
      });
    }
  }

  // Get active user count per role
  const userCounts = await prisma.user.groupBy({
    by: ['role','roleCode'],
    where: { deletedAt: null },
    _count: { id: true },
  });

  const countMap = userCounts.reduce((acc, curr) => {
    const code = curr.roleCode || curr.role;
    acc[code] = (acc[code] || 0) + curr._count.id;
    return acc;
  }, {});

  return rolesList.map((r) => ({
    ...r,
    baseRole: r.isSystem ? r.code : r.baseRole || 'SALES',
    userCount: countMap[r.code] || 0,
  }));
};

/**
 * Get a single role by its code.
 */
export const getRoleByCode = async (code) => {
  const roles = await getAllRoles();
  const normalized = String(code).trim().toUpperCase();
  const found = roles.find((r) => r.code === normalized);
  if (!found) {
    throw new AppError(`Role dengan kode '${normalized}' tidak ditemukan`, 404);
  }
  return found;
};

/**
 * Create a new custom role.
 */
export const createRole = async (data) => {
  const rawCode = String(data.code || '').trim().toUpperCase();
  const cleanCode = rawCode.replace(/[^A-Z0-9_]/g, '_');

  if (!cleanCode || cleanCode.length < 3) {
    throw new AppError('Kode role minimal 3 karakter (huruf, angka, atau underscore)', 400);
  }

  const existingRoles = await getAllRoles();
  if (existingRoles.some((r) => r.code === cleanCode)) {
    throw new AppError(`Role dengan kode '${cleanCode}' sudah ada`, 400);
  }

  const baseRole = data.baseRole || 'SALES';
  if (!BUILT_IN_ROLES.some(r=>r.code===baseRole)) throw new AppError('Pilih role dasar bawaan',400);
  const newRole = {
    baseRole,
    code: cleanCode,
    name: String(data.name || cleanCode).trim(),
    description: String(data.description || '').trim(),
    badgeColor: data.badgeColor || 'indigo',
    isSystem: false,
    workspaceTab: data.workspaceTab || 'role-workspace',
    defaultPermissions: validatedPermissions(data.defaultPermissions),
  };

  const updatedList = [...existingRoles.map(({ userCount, ...rest }) => rest), newRole];

  await prisma.systemConfig.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: updatedList },
    update: { value: updatedList },
  });

  return newRole;
};

/**
 * Update role definition or permission template.
 */
export const updateRole = async (code, data) => {
  const normalized = String(code).trim().toUpperCase();
  const existingRoles = await getAllRoles();
  const roleIndex = existingRoles.findIndex((r) => r.code === normalized);

  if (roleIndex === -1) {
    throw new AppError(`Role dengan kode '${normalized}' tidak ditemukan`, 404);
  }

  const current = existingRoles[roleIndex];

  const updatedRole = {
    ...current,
    name: data.name !== undefined ? String(data.name).trim() : current.name,
    description: data.description !== undefined ? String(data.description).trim() : current.description,
    badgeColor: data.badgeColor || current.badgeColor,
    workspaceTab: data.workspaceTab || current.workspaceTab,
    defaultPermissions: data.defaultPermissions
      ? validatedPermissions(data.defaultPermissions)
      : current.defaultPermissions,
  };

  // Keep isSystem and code intact
  updatedRole.isSystem = current.isSystem;
  updatedRole.code = current.code;

  existingRoles[roleIndex] = updatedRole;

  const strippedList = existingRoles.map(({ userCount, ...rest }) => rest);

  await prisma.systemConfig.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: strippedList },
    update: { value: strippedList },
  });

  return updatedRole;
};

/**
 * Delete a custom role. Built-in roles cannot be deleted.
 */
export const deleteRole = async (code) => {
  const normalized = String(code).trim().toUpperCase();
  const existingRoles = await getAllRoles();
  const target = existingRoles.find((r) => r.code === normalized);

  if (!target) {
    throw new AppError(`Role '${normalized}' tidak ditemukan`, 404);
  }

  if (target.isSystem) {
    throw new AppError(`Role bawaan sistem '${normalized}' tidak dapat dihapus`, 400);
  }

  // Check if any user still has this role
  const userCount = await prisma.user.count({
    where: { roleCode: normalized, deletedAt: null },
  });

  if (userCount > 0) {
    throw new AppError(
      `Role '${normalized}' masih digunakan oleh ${userCount} pengguna. Ubah role pengguna tersebut terlebih dahulu.`,
      400
    );
  }

  const updatedList = existingRoles
    .filter((r) => r.code !== normalized)
    .map(({ userCount, ...rest }) => rest);

  await prisma.systemConfig.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: updatedList },
    update: { value: updatedList },
  });

  return { success: true, message: `Role '${normalized}' berhasil dihapus` };
};

/**
 * Get all available permissions metadata.
 */
export const getAllPermissions = () => {
  return ALL_PERMISSIONS;
};
