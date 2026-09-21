/** deleteCluster - single-responsibility service (extracted from clusters.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateClusterCache } from './clusters.helpers.js';


export const deleteCluster = async (id) => {
  const result = await prisma.cluster.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  invalidateClusterCache(id);
  return result;
};
