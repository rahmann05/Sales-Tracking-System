import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { cacheGetOrFetch, cacheInvalidate } from '../../utils/cacheHelper.js';
import { CACHE_KEYS } from '../../config/cache.js';
import { broadcastCacheInvalidation } from '../../config/socket.js';
import { haversineKm } from './cluster-generator.service.js';

export const getClusters = async () => {
  // Trigger nodemon restart
  return await cacheGetOrFetch(
    CACHE_KEYS.ALL_CLUSTERS,
    async () => {
      return await prisma.cluster.findMany({
        where: { deletedAt: null },
        include: { 
          _count: { select: { outlets: true, users: true } },
          routes: true
        },
        orderBy: { name: 'asc' },
      });
    },
    300
  );
};

export const getClusterById = async (id) => {
  return await cacheGetOrFetch(
    CACHE_KEYS.CLUSTER_BY_ID(id),
    async () => {
      const cluster = await prisma.cluster.findUnique({
        where: { id },
        include: { 
          outlets: { where: { deletedAt: null } },
          routes: true,
          assignedSales: { select: { id: true, name: true } }
        },
      });
      if (!cluster || cluster.deletedAt) {
        throw new AppError('Cluster tidak ditemukan', 404);
      }
      return cluster;
    },
    300
  );
};

const invalidateClusterCache = (id = null) => {
  cacheInvalidate(CACHE_KEYS.ALL_CLUSTERS);
  cacheInvalidate(CACHE_KEYS.ALL_OUTLETS);
  if (id) cacheInvalidate(CACHE_KEYS.CLUSTER_BY_ID(id));
  broadcastCacheInvalidation('clusters');
};

export const createCluster = async (data) => {
  const result = await prisma.cluster.create({ data });
  invalidateClusterCache();
  return result;
};

export const updateCluster = async (id, data) => {
  const result = await prisma.cluster.update({ where: { id }, data });
  invalidateClusterCache(id);
  return result;
};

export const deleteCluster = async (id) => {
  const result = await prisma.cluster.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  invalidateClusterCache(id);
  return result;
};

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

export const generateClusterRoutes = async (outletIds) => {
  if (!outletIds || outletIds.length === 0) return [];
  
  const outlets = await prisma.outlet.findMany({
    where: { id: { in: outletIds } }
  });

  if (outlets.length === 0) return [];

  // Cari 3 titik terluar (sebagai titik awal berbeda untuk rute alternatif)
  // Cara simple: 1. Paling Utara, 2. Paling Selatan, 3. Paling Barat (atau Timur)
  let sortedByLat = [...outlets].sort((a, b) => b.latitude - a.latitude);
  let sortedByLng = [...outlets].sort((a, b) => a.longitude - b.longitude);

  const startPoints = [
    sortedByLat[0], // Paling Utara
    sortedByLat[sortedByLat.length - 1], // Paling Selatan
    sortedByLng[0] // Paling Barat
  ];

  const uniqueStartPoints = [];
  startPoints.forEach(p => {
    if (!uniqueStartPoints.find(u => u.id === p.id)) uniqueStartPoints.push(p);
  });
  // Jika kurang dari 3 titik (misal karena outlet sangat sedikit), fallback ambil random
  while (uniqueStartPoints.length < 3 && uniqueStartPoints.length < outlets.length) {
    let unselected = outlets.find(o => !uniqueStartPoints.find(u => u.id === o.id));
    if (unselected) uniqueStartPoints.push(unselected);
  }

  // Bangun 3 rute greedy nearest-neighbor dari masing-masing titik awal
  const routes = uniqueStartPoints.map((startOutlet, index) => {
    const remaining = [...outlets];
    const ordered = [];
    let current = remaining.splice(remaining.findIndex(o => o.id === startOutlet.id), 1)[0];
    ordered.push(current);
    
    let totalDistanceKm = 0;

    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = haversineKm(current.latitude, current.longitude, remaining[i].latitude, remaining[i].longitude);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      totalDistanceKm += bestDist;
      current = remaining.splice(bestIdx, 1)[0];
      ordered.push(current);
    }

    return {
      routeIndex: index,
      isActive: index === 0, // rute pertama aktif by default
      totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
      startOutletId: startOutlet.id,
      outletOrder: ordered.map((o, idx) => ({ id: o.id, sequence: idx + 1 }))
    };
  });

  return routes;
};

export const createClusterFull = async (data) => {
  const { outletIds, routes, assignedSalesId, ...clusterData } = data;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Cluster
    const cluster = await tx.cluster.create({
      data: {
        ...clusterData,
        assignedSalesId,
        outletCount: outletIds?.length || 0,
      }
    });

    // 2. Assign Outlets to Cluster
    if (outletIds && outletIds.length > 0) {
      await tx.outlet.updateMany({
        where: { id: { in: outletIds } },
        data: { clusterId: cluster.id }
      });
    }

    // 3. Create Routes
    if (routes && routes.length > 0) {
      const routesData = routes.map(r => ({
        ...r,
        clusterId: cluster.id
      }));
      await tx.clusterRoute.createMany({ data: routesData });
    }

    return cluster;
  });

  // Invalidate Caches
  invalidateClusterCache();
  cacheInvalidate(CACHE_KEYS.ALL_OUTLETS);
  broadcastCacheInvalidation('outlets');

  return result;
};

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

export const updateClusterRoutes = async (id, routes) => {
  await prisma.$transaction(async (tx) => {
    await tx.clusterRoute.deleteMany({ where: { clusterId: id } });
    if (routes && routes.length > 0) {
      const routesData = routes.map(r => ({ ...r, clusterId: id }));
      await tx.clusterRoute.createMany({ data: routesData });
    }
  });

  invalidateClusterCache(id);
  return { success: true };
};

export const setActiveRoute = async (id, routeIndex) => {
  await prisma.$transaction(async (tx) => {
    await tx.clusterRoute.updateMany({
      where: { clusterId: id },
      data: { isActive: false }
    });
    await tx.clusterRoute.updateMany({
      where: { clusterId: id, routeIndex },
      data: { isActive: true }
    });
  });

  invalidateClusterCache(id);
  return { success: true };
};
