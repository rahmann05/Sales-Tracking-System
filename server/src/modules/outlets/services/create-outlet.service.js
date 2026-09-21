/** createOutlet - single-responsibility service (extracted from outlets.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateOutletCache } from './outlets.helpers.js';


export const createOutlet = async (data) => {
  const result = await prisma.outlet.create({ data });
  invalidateOutletCache();
  return result;
};
