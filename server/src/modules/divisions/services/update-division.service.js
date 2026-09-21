/** updateDivision - single-responsibility service (extracted from divisions.service.js). */
import { prisma } from '../../../config/prisma.js';

// Update division
export const updateDivision = async (id, { name, code, isActive }) => {
  const data = {};
  if (name !== undefined) data.name = name.trim().toUpperCase();
  if (code !== undefined) data.code = code ? code.trim().toUpperCase() : null;
  if (isActive !== undefined) data.isActive = isActive;
  return prisma.division.update({ where: { id }, data });
};
