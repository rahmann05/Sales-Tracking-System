/** updateClusterOutlets - single-responsibility service (extracted from clusters.service.js). */
import { prisma } from '../../../config/prisma.js';
import { cacheGetOrFetch, cacheInvalidate } from '../../../utils/cacheHelper.js';
import { CACHE_KEYS } from '../../../config/cache.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';
import { invalidateClusterCache } from './clusters.helpers.js';


export const updateClusterOutlets = async (id, outletIds) => {
  // Ini memerlukan un-assign outlet lama dan assign outlet baru.
  // Untuk kesederhanaan saat manual edit, kita tidak otomatis re-generate rute di server.
  // Rute harus di-re-generate client dan dikirim via updateRoutes.
  
  await prisma.$transaction(async (tx) => {
    // Cari outlet yang sebelumnya di cluster ini tapi sekarang tidak ada
    await tx.outlet.updateMany({
      where: { clusterId: id, id: { notIn: outletIds } },
      data: { clusterId: "UNASSIGNED_OR_DEFAULT" } // Asumsi fallback, atau handle logic unassign yang sesuai bisnis
    });

    // Assign outlet baru
    if (outletIds.length > 0) {
      await tx.outlet.updateMany({
        where: { id: { in: outletIds } },
        data: { clusterId: id }
      });
    }
  });

  invalidateClusterCache(id);
  cacheInvalidate(CACHE_KEYS.ALL_OUTLETS);
  broadcastCacheInvalidation('outlets');
  return { success: true };
};
