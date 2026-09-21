/** getNearestOutlets - single-responsibility service (extracted from clusters.service.js). */
import { prisma } from '../../../config/prisma.js';
import { cacheGetOrFetch, cacheInvalidate } from '../../../utils/cacheHelper.js';
import { CACHE_KEYS } from '../../../config/cache.js';
import { haversineKm } from '../cluster-generator.service.js';

// --- NEW FULL PAGE BUILDER LOGIC ---
export const getNearestOutlets = async (lat, lng, count, type = null) => {
  // Ambil semua outlet (memanfaatkan cache jika ada)
  let allOutlets = await cacheGetOrFetch(
    CACHE_KEYS.ALL_OUTLETS,
    async () => {
      return await prisma.outlet.findMany({
        where: { deletedAt: null },
        include: { cluster: { select: { id: true, name: true, region: true } } },
      });
    },
    300
  );

  // Filter outlet yang tidak memiliki lat/lng valid dan sesuai type (jika diberikan)
  let validOutlets = allOutlets.filter(o => 
    o.latitude != null && 
    o.longitude != null && 
    (type ? o.type === type : true)
  );

  // Hitung jarak haversine ke setiap outlet
  let withDistances = validOutlets.map(o => ({
    ...o,
    distanceToCenterKm: haversineKm(lat, lng, o.latitude, o.longitude)
  }));

  // Urutkan berdasarkan jarak terdekat
  withDistances.sort((a, b) => a.distanceToCenterKm - b.distanceToCenterKm);

  // Ambil N terdekat
  return withDistances.slice(0, count);
};
