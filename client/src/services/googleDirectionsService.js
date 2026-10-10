import { request } from './httpClient';
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
        .filter(w=>(w.lat??w.latitude)!=null&&(w.lng??w.longitude)!=null).map((w) => `${w.lat ?? w.latitude},${w.lng ?? w.longitude}`)
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
    if((origin?.lat??origin?.latitude)==null||(origin?.lng??origin?.longitude)==null||waypoints.some(w=>(w?.lat??w?.latitude)==null||(w?.lng??w?.longitude)==null))throw new Error('Koordinat sebagian tujuan belum tersedia. Periksa data lokasi sebelum menghitung rute.');
    const rawOrigin = { googleMapsOnly:origin.googleMapsOnly,outletId:origin.outletId,lat: Number(origin?.lat ?? origin?.latitude), lng: Number(origin?.lng ?? origin?.longitude) };
    const directPath = [rawOrigin];

    const validWaypoints = [];
    waypoints.forEach((wp) => {
      const lat = Number(wp?.lat ?? wp?.latitude);
      const lng = Number(wp?.lng ?? wp?.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        directPath.push({ lat, lng,googleMapsOnly:wp.googleMapsOnly,outletId:wp.outletId });
        validWaypoints.push({ lat, lng });
      }
    });

    if (directPath.length < 2) return directPath;

    // Strategy 1: Google Maps JS SDK DirectionsService (client-side in-page)
    if (typeof window !== 'undefined' && window.google?.maps?.DirectionsService) {
      try {
        const directionsService = new window.google.maps.DirectionsService();
        const dest = directPath[directPath.length - 1];
        const midPoints = directPath.slice(1, -1).slice(0, 23).map((pt) => ({
          location: { lat: pt.lat, lng: pt.lng },
          stopover: true,
        }));

        let timeout;
        const result = await Promise.race([new Promise((resolve, reject) => {
          directionsService.route(
            {
              origin: {lat:rawOrigin.lat,lng:rawOrigin.lng},
              destination: {lat:dest.lat,lng:dest.lng},
              waypoints: midPoints,
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (response, status) => {
              if (status === window.google.maps.DirectionsStatus.OK && response?.routes?.[0]?.overview_path) {
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
        }),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('DirectionsService timeout')),8000);})]).finally(()=>clearTimeout(timeout));

        if (result && result.length > 0) return result;
      } catch (sdkErr) {
        console.warn('[googleDirectionsService] SDK route failed, falling back to backend:', sdkErr.message);
      }
    }

    // Strategy 2: Backend routing service (/api/v1/routing/road-route)
    try {
      const data=await request('/routing/road-route',{method:'POST',body:JSON.stringify({waypoints:directPath})});
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
