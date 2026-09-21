/** updateOutlet - single-responsibility service (extracted from outlets.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateOutletCache } from './outlets.helpers.js';


export const updateOutlet = async (id, data) => {
  const result = await prisma.outlet.update({ where: { id }, data });
  invalidateOutletCache();
  return result;
};
