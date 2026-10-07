/** updateDivision - single-responsibility service (extracted from divisions.service.js). */
import { prisma } from '../../../config/prisma.js';
import { validateCodeUpdate } from '../../config/services/business-code.service.js';

// Update division
export const updateDivision = async (id, { name, code, isActive }) => {
  const data = {};
  if (name !== undefined) data.name = name.trim().toUpperCase();
  if (code !== undefined) data.code = await validateCodeUpdate('DIVISION',code?.trim().toUpperCase(),id);
  if (isActive !== undefined) data.isActive = isActive;
  return prisma.division.update({ where: { id }, data });
};
