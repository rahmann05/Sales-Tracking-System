/** deleteOutlet - single-responsibility service (extracted from outlets.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateOutletCache } from './outlets.helpers.js';


export const deleteOutlet = async (id) => {
  const result = await prisma.outlet.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  invalidateOutletCache();
  return result;
};
