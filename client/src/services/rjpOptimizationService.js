/**
 * RJP Optimization Service
 * Single Responsibility: Pure Mathematical & Algorithmic Route Optimization (Spatial Distance & TSP Sequencing).
 * 1 File = 1 Pure Logic Service
 */

/**
 * Calculates Haversine distance in Kilometers between two GPS coordinates.
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

/**
 * Optimizes a list of outlet stops using Traveling Salesperson Problem (Nearest Neighbor)
 * to order them sequentially (#1 to #N) with minimal total travel distance.
 */
export const optimizeTspSequence = (outlets = [], startPoint = { latitude: -6.8722, longitude: 107.5423 }) => {
  if (!outlets || outlets.length <= 1) {
    return outlets.map((o, idx) => ({ ...o, sequence: idx + 1, legDistanceKm: 0, cumulativeDistanceKm: 0 }));
  }

  const unvisited = [...outlets];
  const orderedRoute = [];
  let currentPos = { lat: startPoint.latitude, lng: startPoint.longitude };

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const outlet = unvisited[i];
      const dist = calculateDistanceKm(
        currentPos.lat,
        currentPos.lng,
        outlet.latitude || -6.8722,
        outlet.longitude || 107.5423
      );

      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    const nextStop = unvisited.splice(nearestIdx, 1)[0];
    nextStop.legDistanceKm = minDistance === Infinity ? 0 : minDistance;
    orderedRoute.push(nextStop);
    currentPos = {
      lat: nextStop.latitude || -6.8722,
      lng: nextStop.longitude || 107.5423,
    };
  }

  let cumulativeDist = 0;
  return orderedRoute.map((stop, index) => {
    cumulativeDist += stop.legDistanceKm || 0;
    return {
      ...stop,
      sequence: index + 1,
      cumulativeDistanceKm: parseFloat(cumulativeDist.toFixed(2)),
    };
  });
};

/**
 * Calculates total route distance for an array of sequenced stops.
 */
export const calculateTotalRouteDistance = (stops = [], startPoint) => {
  if (!stops || stops.length === 0) return 0;
  const sequenced = optimizeTspSequence(stops, startPoint);
  return sequenced.reduce((acc, curr) => acc + (curr.legDistanceKm || 0), 0);
};
