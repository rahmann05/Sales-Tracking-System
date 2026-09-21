import { prisma } from '../../config/prisma.js';

// Get all active divisions
export const getDivisions = async ({ includeInactive = false } = {}) => {
  const where = includeInactive ? {} : { isActive: true };
  return prisma.division.findMany({
    where,
    orderBy: { name: 'asc' },
  });
};

// Get division by id
export const getDivisionById = async (id) => {
  return prisma.division.findUnique({ where: { id } });
};

// Create a new division (admin only)
export const createDivision = async ({ name, code }) => {
  return prisma.division.create({
    data: {
      name: name.trim().toUpperCase(),
      code: code ? code.trim().toUpperCase() : null,
    },
  });
};

// Update division
export const updateDivision = async (id, { name, code, isActive }) => {
  const data = {};
  if (name !== undefined) data.name = name.trim().toUpperCase();
  if (code !== undefined) data.code = code ? code.trim().toUpperCase() : null;
  if (isActive !== undefined) data.isActive = isActive;
  return prisma.division.update({ where: { id }, data });
};

// Delete division (soft delete via isActive = false)
export const deleteDivision = async (id) => {
  return prisma.division.update({ where: { id }, data: { isActive: false } });
};
