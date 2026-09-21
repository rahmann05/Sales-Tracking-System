/** assignByProximity - single-responsibility service (extracted from cluster-generator.service.js). */
import { DAY_ORDER } from './cluster-generator.helpers.js';
import { haversineKm } from './haversine-km.service.js';

/**
 * Greedy nearest-neighbor: urutkan outlet berdasarkan kedekatan,
 * lalu potong berurutan sesuai quota -> setiap cluster berisi outlet terdekat.
 * Urutan dalam cluster sudah optimal (jalur rute terpendek secara greedy).
 *
 * @param {Array<{id:string, latitude:number, longitude:number}>} outlets
 * @param {Record<string, number>} quotas
 * @returns {Array<{ day:string, outlets:Array, totalDistanceKm:number }>}
 */
export const assignByProximity = (outlets, quotas) => {
  const remaining = [...outlets];
  const sorted = []; // urutan greedy global

  // Mulai dari outlet paling utara-barat (deterministik) lalu rantai terdekat
  remaining.sort((a, b) => a.latitude - b.latitude || a.longitude - b.longitude);

  let current = remaining.shift();
  sorted.push(current);
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
    current = remaining.splice(bestIdx, 1)[0];
    sorted.push(current);
  }

  // Potong berurutan sesuai quota
  const result = [];
  let cursor = 0;
  for (const day of DAY_ORDER) {
    const q = quotas[day] || 0;
    const slice = sorted.slice(cursor, cursor + q);
    cursor += q;
    if (slice.length === 0) continue;

    // Hitung total jarak rute (informasi untuk optimasi manual)
    let totalDistanceKm = 0;
    for (let i = 1; i < slice.length; i++) {
      totalDistanceKm += haversineKm(
        slice[i - 1].latitude, slice[i - 1].longitude,
        slice[i].latitude, slice[i].longitude,
      );
    }
    result.push({ day, outlets: slice, totalDistanceKm: Math.round(totalDistanceKm * 100) / 100 });
  }
  return result;
};
