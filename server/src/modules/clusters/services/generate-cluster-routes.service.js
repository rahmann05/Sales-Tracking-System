/** generateClusterRoutes - single-responsibility service (extracted from clusters.service.js). */
import { prisma } from '../../../config/prisma.js';
import { haversineKm } from '../cluster-generator.service.js';
import { optimize2Opt } from './clusters.helpers.js';


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
