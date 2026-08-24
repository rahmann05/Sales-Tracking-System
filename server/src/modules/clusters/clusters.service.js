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
          routes: true,
          assignedSales: { select: { id: true, name: true, role: true } },
          users: { select: { id: true, name: true, role: true } }
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
          assignedSales: { select: { id: true, name: true, role: true } },
          users: { select: { id: true, name: true, role: true } }
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
  const result = await prisma.cluster.create({
    data,
    include: {
      _count: { select: { outlets: true, users: true } },
      routes: true,
      assignedSales: { select: { id: true, name: true, role: true } },
      users: { select: { id: true, name: true, role: true } }
    },
  });
  invalidateClusterCache();
  return result;
};

export const updateCluster = async (id, data) => {
  const result = await prisma.cluster.update({
    where: { id },
    data,
    include: {
      _count: { select: { outlets: true, users: true } },
      routes: true,
      assignedSales: { select: { id: true, name: true, role: true } },
      users: { select: { id: true, name: true, role: true } }
    },
  });
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

/**
 * 2-Opt Local Search Optimizer for TSP path (eliminates intersecting lines and reduces total distance)
 */
const optimize2Opt = (initialRoute) => {
  let bestRoute = [...initialRoute];
  let improved = true;
  let iterations = 0;

  const calcDist = (route) => {
    let d = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const seg = haversineKm(route[i].latitude, route[i].longitude, route[i + 1].latitude, route[i + 1].longitude);
      if (!isNaN(seg)) d += seg;
    }
    return d;
  };

  let bestDist = calcDist(bestRoute);

  while (improved && iterations < 50) {
    improved = false;
    iterations++;

    for (let i = 0; i < bestRoute.length - 1; i++) {
      for (let k = i + 1; k < bestRoute.length; k++) {
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, k + 1).reverse(),
          ...bestRoute.slice(k + 1),
        ];
        const newDist = calcDist(newRoute);
        if (newDist < bestDist - 0.005) {
          bestRoute = newRoute;
          bestDist = newDist;
          improved = true;
        }
      }
    }
  }

  return { route: bestRoute, distanceKm: bestDist };
};

export const generateClusterRoutes = async (outletIds) => {
  if (!outletIds || !Array.isArray(outletIds) || outletIds.length === 0) return [];
  
  const outlets = await prisma.outlet.findMany({
    where: { 
      id: { in: outletIds },
      deletedAt: null,
    }
  });

  if (outlets.length === 0) return [];

  // Convert lat/lng to Number and filter out invalid coordinates
  const sanitizedOutlets = outlets.map(o => ({
    ...o,
    latitude: Number(o.latitude),
    longitude: Number(o.longitude)
  })).filter(o => o.latitude != null && o.longitude != null && !isNaN(o.latitude) && !isNaN(o.longitude));

  if (sanitizedOutlets.length === 0) return [];

  if (sanitizedOutlets.length === 1) {
    return [{
      routeIndex: 0,
      isActive: true,
      totalDistanceKm: 0,
      startOutletId: sanitizedOutlets[0].id,
      outletOrder: [{ id: sanitizedOutlets[0].id, sequence: 1 }]
    }];
  }

  // Multi-Start Nearest Neighbor + 2-Opt Optimization across all candidate start outlets
  const allCandidateRoutes = [];

  for (let s = 0; s < sanitizedOutlets.length; s++) {
    const startOutlet = sanitizedOutlets[s];
    const remaining = [...sanitizedOutlets];
    const startIdx = remaining.findIndex(o => o.id === startOutlet.id);
    const ordered = [];
    let current = startIdx >= 0 ? remaining.splice(startIdx, 1)[0] : remaining.shift();
    if (current) ordered.push(current);

    while (remaining.length > 0 && current) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = haversineKm(current.latitude, current.longitude, remaining[i].latitude, remaining[i].longitude);
        if (!isNaN(d) && d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      current = remaining.splice(bestIdx, 1)[0];
      if (current) ordered.push(current);
    }

    // Apply 2-Opt local search on greedy route to untangle crossings and minimize distance
    const optimized = optimize2Opt(ordered);

    allCandidateRoutes.push({
      startOutletId: optimized.route[0]?.id,
      endOutletId: optimized.route[optimized.route.length - 1]?.id,
      totalDistanceKm: Math.round(optimized.distanceKm * 100) / 100,
      route: optimized.route,
    });
  }

  // Sort candidate routes by shortest total distance (most optimal first)
  allCandidateRoutes.sort((a, b) => a.totalDistanceKm - b.totalDistanceKm);

  // Pick up to 3 diverse, distinct top routes
  const distinctRoutes = [];
  for (const cand of allCandidateRoutes) {
    const isDuplicate = distinctRoutes.some(
      r => r.startOutletId === cand.startOutletId && r.endOutletId === cand.endOutletId
    );
    if (!isDuplicate) {
      distinctRoutes.push(cand);
      if (distinctRoutes.length >= 3) break;
    }
  }

  // If still less than 3, add reverse of the best route
  if (distinctRoutes.length < 3 && distinctRoutes.length > 0) {
    const best = distinctRoutes[0];
    const reversedRoute = [...best.route].reverse();
    distinctRoutes.push({
      startOutletId: reversedRoute[0]?.id,
      endOutletId: reversedRoute[reversedRoute.length - 1]?.id,
      totalDistanceKm: best.totalDistanceKm,
      route: reversedRoute,
    });
  }

  // Format response matching schema
  const routes = distinctRoutes.slice(0, 3).map((r, index) => ({
    routeIndex: index,
    isActive: index === 0,
    totalDistanceKm: r.totalDistanceKm,
    startOutletId: r.startOutletId,
    outletOrder: r.route.map((o, idx) => ({ id: o.id, sequence: idx + 1 })),
  }));

  return routes;
};

export const createClusterFull = async (data) => {
  const { outletIds, routes, assignedSalesId, color, colorHex, ...rest } = data;

  const validSalesId = assignedSalesId && assignedSalesId.trim() !== '' ? assignedSalesId : null;
  const clusterColorHex = colorHex || color || '#3b82f6';

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Cluster
    const cluster = await tx.cluster.create({
      data: {
        ...rest,
        colorHex: clusterColorHex,
        assignedSalesId: validSalesId,
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
      const routesData = routes.map((r, i) => ({
        clusterId: cluster.id,
        routeIndex: r.routeIndex ?? i,
        isActive: Boolean(r.isActive),
        totalDistanceKm: Number(r.totalDistanceKm || 0),
        outletOrder: r.outletOrder || [],
        overviewPath: r.overviewPath || null,
        startOutletId: r.startOutletId && r.startOutletId.trim() !== '' ? r.startOutletId : null,
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
