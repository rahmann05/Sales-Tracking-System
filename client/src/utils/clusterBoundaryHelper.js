import { getClusterColorHex } from '../services/clusterColorService';

/**
 * 2D Cross Product of vectors OA and OB
 * > 0 if counterclockwise, < 0 if clockwise, 0 if collinear
 */
function crossProduct(o, a, b) {
  return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
}

/**
 * Andrew's Monotone Chain Convex Hull algorithm
 * @param {Array<{lat: number, lng: number}>} points
 * @returns {Array<{lat: number, lng: number}>}
 */
export function getConvexHull(points = []) {
  if (points.length <= 2) return points;

  // Sort by lng, then lat
  const sorted = points.slice().sort((a, b) => (a.lng === b.lng ? a.lat - b.lat : a.lng - b.lng));

  // Lower hull
  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  // Upper hull
  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/**
 * Generate a regular polygon approximation for circle (e.g. for small clusters or center points)
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusMeters
 * @param {number} numPoints
 */
export function generateCirclePolygon(lat, lng, radiusMeters = 800, numPoints = 12) {
  const points = [];
  const earthRadius = 6378137; // meters
  const dLat = (radiusMeters / earthRadius) * (180 / Math.PI);
  const dLng = dLat / Math.cos((lat * Math.PI) / 180);

  for (let i = 0; i < numPoints; i++) {
    const theta = (i / numPoints) * 2 * Math.PI;
    points.push({
      lat: lat + dLat * Math.sin(theta),
      lng: lng + dLng * Math.cos(theta),
    });
  }
  return points;
}

/**
 * Expand convex hull vertices away from centroid to add comfortable padding around outlets
 */
function expandHull(vertices, scale = 1.22) {
  if (!vertices || vertices.length < 3) return vertices;

  let sumLat = 0;
  let sumLng = 0;
  for (const v of vertices) {
    sumLat += v.lat;
    sumLng += v.lng;
  }
  const cLat = sumLat / vertices.length;
  const cLng = sumLng / vertices.length;

  return vertices.map((v) => ({
    lat: cLat + (v.lat - cLat) * scale,
    lng: cLng + (v.lng - cLng) * scale,
  }));
}

/**
 * Computes boundary polygon data for each cluster given the list of clusters and outlets.
 * @param {Array} clusters - Clusters from API
 * @param {Array} outlets - Outlets from API
 * @returns {Array} Array of polygon objects ready for MapContext setPolygons
 */
export function computeClusterPolygons(clusters = [], outlets = []) {
  if (!clusters || clusters.length === 0) return [];

  const result = [];

  clusters.forEach((cluster, idx) => {
    // 1. Gather all outlets belonging to this cluster
    const clusterOutlets = (outlets || []).filter(
      (o) => o.clusterId === cluster.id && o.latitude && o.longitude
    );

    const color = cluster.colorHex || getClusterColorHex(cluster.name, idx);

    if (clusterOutlets.length >= 3) {
      const rawPoints = clusterOutlets.map((o) => ({
        lat: Number(o.latitude),
        lng: Number(o.longitude),
      }));

      const hull = getConvexHull(rawPoints);
      const expandedPath = expandHull(hull, 1.2);

      // Centroid
      const cLat = expandedPath.reduce((acc, p) => acc + p.lat, 0) / expandedPath.length;
      const cLng = expandedPath.reduce((acc, p) => acc + p.lng, 0) / expandedPath.length;

      result.push({
        id: cluster.id,
        name: cluster.name,
        region: cluster.region,
        color,
        fillOpacity: 0.14,
        center: { lat: cLat, lng: cLng },
        path: expandedPath,
        outletCount: clusterOutlets.length,
        outlets: clusterOutlets,
      });
    } else if (clusterOutlets.length > 0) {
      // 1 or 2 outlets: circle polygon around center of outlets
      const avgLat = clusterOutlets.reduce((acc, o) => acc + Number(o.latitude), 0) / clusterOutlets.length;
      const avgLng = clusterOutlets.reduce((acc, o) => acc + Number(o.longitude), 0) / clusterOutlets.length;
      const circlePath = generateCirclePolygon(avgLat, avgLng, 700);

      result.push({
        id: cluster.id,
        name: cluster.name,
        region: cluster.region,
        color,
        fillOpacity: 0.14,
        center: { lat: avgLat, lng: avgLng },
        path: circlePath,
        outletCount: clusterOutlets.length,
        outlets: clusterOutlets,
      });
    } else if (cluster.centerLat && cluster.centerLng) {
      // Center coordinates only
      const circlePath = generateCirclePolygon(Number(cluster.centerLat), Number(cluster.centerLng), 1000);

      result.push({
        id: cluster.id,
        name: cluster.name,
        region: cluster.region,
        color,
        fillOpacity: 0.12,
        center: { lat: Number(cluster.centerLat), lng: Number(cluster.centerLng) },
        path: circlePath,
        outletCount: 0,
        outlets: [],
      });
    }
  });

  return result;
}
