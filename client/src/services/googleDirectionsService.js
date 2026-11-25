import { request } from './httpClient.js';

const ROAD_ROUTE_CACHE_MAX = 50;
const roadRouteCache = new Map();

const normalizePoint = (pt) => {
  const rawLat = pt?.lat ?? pt?.latitude;
  const rawLng = pt?.lng ?? pt?.longitude;
  if (rawLat == null || rawLng == null || rawLat === '' || rawLng === '') return null;
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }
  return {
    lat,
    lng,
    googleMapsOnly: Boolean(pt?.googleMapsOnly),
    ...(pt?.outletId ? { outletId: pt.outletId } : {}),
  };
};

export const chunkWaypoints = (points = [], maxPerChunk = 25) => {
  if (!Array.isArray(points) || points.length === 0) return [];
  if (points.length <= maxPerChunk) return [points];
  const chunks = [];
  const step = Math.max(1, maxPerChunk - 1);
  for (let i = 0; i < points.length - 1; i += step) {
    chunks.push(points.slice(i, i + maxPerChunk));
    if (i + maxPerChunk >= points.length) break;
  }
  return chunks;
};

const stitchPaths = (segments = []) => {
  const combined = [];
  for (const seg of segments) {
    for (const pt of seg || []) {
      const prev = combined[combined.length - 1];
      if (
        prev &&
        Math.abs(prev.lat - pt.lat) < 1e-6 &&
        Math.abs(prev.lng - pt.lng) < 1e-6
      ) {
        continue;
      }
      combined.push({ lat: Number(pt.lat), lng: Number(pt.lng) });
    }
  }
  return combined;
};

const setCachedRoadRoute = (key, value) => {
  if (roadRouteCache.size >= ROAD_ROUTE_CACHE_MAX) {
    const firstKey = roadRouteCache.keys().next().value;
    if (firstKey !== undefined) roadRouteCache.delete(firstKey);
  }
  roadRouteCache.set(key, value);
};

const resolveViaGoogleSdk = async (chunk) => {
  const directionsService = new window.google.maps.DirectionsService();
  const origin = chunk[0];
  const dest = chunk[chunk.length - 1];
  const midPoints = chunk.slice(1, -1).map((pt) => ({
    location: { lat: pt.lat, lng: pt.lng },
    stopover: true,
  }));

  let timeout;
  return await Promise.race([
    new Promise((resolve, reject) => {
      directionsService.route(
        {
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: dest.lat, lng: dest.lng },
          waypoints: midPoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
          const route = response?.routes?.[0];
          if (status === window.google.maps.DirectionsStatus.OK && route) {
            const detailed =
              route.legs?.flatMap((leg) =>
                leg.steps?.flatMap((step) => step.path || []) || []
              ) || [];
            const rawCoords = detailed.length > 0 ? detailed : route.overview_path || [];
            const path = rawCoords.map((p) => ({ lat: p.lat(), lng: p.lng() }));
            if (path.length > 0) resolve(path);
            else reject(new Error('DirectionsService returned empty path'));
          } else {
            reject(new Error(`DirectionsService status: ${status}`));
          }
        }
      );
    }),
    new Promise((_, reject) => {
      timeout = setTimeout(() => reject(new Error('DirectionsService timeout')), 8000);
    }),
  ]).finally(() => clearTimeout(timeout));
};

/**
 * Google Directions & Roads API Helper Service
 * Single Responsibility: Pure Google Directions API & Roads API helper consuming system latitude & longitude coordinates.
 * 1 File = 1 Pure Service
 */

export const googleDirectionsService = {
  /**
   * Generates a direct Google Maps Directions Navigation URL
   * Consumes system latitude & longitude coordinates directly.
   */
  getDirectionsUrl: (origin, destination, waypoints = []) => {
    if (!origin || !destination) return 'https://www.google.com/maps';

    const originStr = `${origin.lat ?? origin.latitude},${origin.lng ?? origin.longitude}`;
    const destStr = `${destination.lat ?? destination.latitude},${destination.lng ?? destination.longitude}`;

    let url = `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=driving`;

    if (waypoints.length > 0) {
      const waypointsStr = waypoints
        .filter((w) => (w.lat ?? w.latitude) != null && (w.lng ?? w.longitude) != null)
        .map((w) => `${w.lat ?? w.latitude},${w.lng ?? w.longitude}`)
        .join('|');
      url += `&waypoints=${encodeURIComponent(waypointsStr)}`;
    }

    return url;
  },

  /**
   * Fetches official driving route polyline coordinates using client Google Maps SDK
   * or backend routing API (/api/v1/routing/road-route) with graceful fallback.
   */
  fetchDirectionsRoute: async (origin, waypoints = []) => {
    if (
      (origin?.lat ?? origin?.latitude) == null ||
      (origin?.lng ?? origin?.longitude) == null ||
      waypoints.some((w) => (w?.lat ?? w?.latitude) == null || (w?.lng ?? w?.longitude) == null)
    )
      throw new Error(
        'Koordinat sebagian tujuan belum tersedia. Periksa data lokasi sebelum menghitung rute.'
      );
    const rawOrigin = {
      googleMapsOnly: origin.googleMapsOnly,
      outletId: origin.outletId,
      lat: Number(origin?.lat ?? origin?.latitude),
      lng: Number(origin?.lng ?? origin?.longitude),
    };
    const directPath = [rawOrigin];

    const validWaypoints = [];
    waypoints.forEach((wp) => {
      const lat = Number(wp?.lat ?? wp?.latitude);
      const lng = Number(wp?.lng ?? wp?.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        directPath.push({ lat, lng, googleMapsOnly: wp.googleMapsOnly, outletId: wp.outletId });
        validWaypoints.push({ lat, lng });
      }
    });

    if (directPath.length < 2) return directPath;

    // Strategy 1: Google Maps JS SDK DirectionsService (client-side in-page)
    if (typeof window !== 'undefined' && window.google?.maps?.DirectionsService) {
      try {
        const directionsService = new window.google.maps.DirectionsService();
        const dest = directPath[directPath.length - 1];
        const midPoints = directPath
          .slice(1, -1)
          .slice(0, 23)
          .map((pt) => ({
            location: { lat: pt.lat, lng: pt.lng },
            stopover: true,
          }));

        let timeout;
        const result = await Promise.race([
          new Promise((resolve, reject) => {
            directionsService.route(
              {
                origin: { lat: rawOrigin.lat, lng: rawOrigin.lng },
                destination: { lat: dest.lat, lng: dest.lng },
                waypoints: midPoints,
                travelMode: window.google.maps.TravelMode.DRIVING,
              },
              (response, status) => {
                if (
                  status === window.google.maps.DirectionsStatus.OK &&
                  response?.routes?.[0]?.overview_path
                ) {
                  const path = response.routes[0].overview_path.map((p) => ({
                    lat: p.lat(),
                    lng: p.lng(),
                  }));
                  resolve(path);
                } else {
                  reject(new Error(`DirectionsService status: ${status}`));
                }
              }
            );
          }),
          new Promise((_, reject) => {
            timeout = setTimeout(() => reject(new Error('DirectionsService timeout')), 8000);
          }),
        ]).finally(() => clearTimeout(timeout));

        if (result && result.length > 0) return result;
      } catch (sdkErr) {
        console.warn(
          '[googleDirectionsService] SDK route failed, falling back to backend:',
          sdkErr.message
        );
      }
    }

    // Strategy 2: Backend routing service (/api/v1/routing/road-route)
    try {
      const data = await request('/routing/road-route', {
        method: 'POST',
        body: JSON.stringify({ waypoints: directPath }),
      });
      if (data.success && data.data?.legs?.length > 0) {
        const fullPath = data.data.legs.flatMap((l) => l.path || []);
        if (fullPath.length > 0) return fullPath;
      }
    } catch (apiErr) {
      console.warn('[googleDirectionsService] Backend routing fallback error:', apiErr.message);
    }

    return directPath;
  },

  /**
   * Resolve road-following route geometry with explicit provider & fallback metadata.
   * Strategy: Google Maps JS SDK -> Backend /routing/road-route (Google/OSRM) -> Straight-line fallback.
   * @param {Array} rawPoints
   * @returns {Promise<{ path: Array<{lat: number, lng: number}>, provider: 'GOOGLE_SDK'|'GOOGLE_API'|'OSRM'|'FALLBACK'|'NONE', isFallback: boolean, reason: string|null }>}
   */
  resolveRoadRouteWithMeta: async (rawPoints = []) => {
    const validPoints = (Array.isArray(rawPoints) ? rawPoints : [])
      .map(normalizePoint)
      .filter(Boolean);

    if (validPoints.length < 2) {
      return {
        path: validPoints.map(({ lat, lng }) => ({ lat, lng })),
        provider: 'NONE',
        isFallback: false,
        reason: null,
      };
    }

    const cacheKey = validPoints
      .map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`)
      .join('|');
    const cached = roadRouteCache.get(cacheKey);
    if (cached) return cached;

    const chunks = chunkWaypoints(validPoints, 25);
    let sdkError = null;
    let apiError = null;

    // Strategy 1: Google Maps JS SDK DirectionsService (browser)
    if (typeof window !== 'undefined' && window.google?.maps?.DirectionsService) {
      try {
        const sdkSegments = [];
        for (const chunk of chunks) {
          sdkSegments.push(await resolveViaGoogleSdk(chunk));
        }
        const path = stitchPaths(sdkSegments);
        if (path.length > 0) {
          const result = { path, provider: 'GOOGLE_SDK', isFallback: false, reason: null };
          setCachedRoadRoute(cacheKey, result);
          return result;
        }
      } catch (err) {
        sdkError = err?.message || 'Google Directions SDK gagal';
      }
    }

    // Strategy 2: Backend /api/v1/routing/road-route (Google Server / OSRM)
    try {
      const apiSegments = [];
      let resolvedProvider = 'OSRM';
      for (const chunk of chunks) {
        const data = await request('/routing/road-route', {
          method: 'POST',
          body: JSON.stringify({ waypoints: chunk }),
        });
        if (!data?.success || !data?.data?.legs?.length) {
          throw new Error(data?.message || 'Layanan rute backend tidak mengembalikan jalur');
        }
        if (data.data.provider === 'google') resolvedProvider = 'GOOGLE_API';
        apiSegments.push(data.data.legs.flatMap((leg) => leg.path || []));
      }
      const path = stitchPaths(apiSegments);
      if (path.length > 0) {
        const result = { path, provider: resolvedProvider, isFallback: false, reason: null };
        setCachedRoadRoute(cacheKey, result);
        return result;
      }
    } catch (err) {
      apiError = err?.message || 'Layanan rute backend gagal';
    }

    // Strategy 3: Explicit straight-line fallback
    return {
      path: validPoints.map(({ lat, lng }) => ({ lat, lng })),
      provider: 'FALLBACK',
      isFallback: true,
      reason: apiError || sdkError || 'Layanan rute jalan tidak tersedia',
    };
  },

  /**
   * Formats distance display text
   */
  formatDistanceText: (distanceKm) => {
    if (distanceKm == null || distanceKm === 0) return '0 Km';
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} Meter`;
    }
    return `${distanceKm.toFixed(1)} Km`;
  },
};
