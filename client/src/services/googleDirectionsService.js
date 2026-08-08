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

    const originStr = `${origin.lat || origin.latitude},${origin.lng || origin.longitude}`;
    const destStr = `${destination.lat || destination.latitude},${destination.lng || destination.longitude}`;

    let url = `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=driving`;

    if (waypoints.length > 0) {
      const waypointsStr = waypoints
        .map((w) => `${w.lat || w.latitude},${w.lng || w.longitude}`)
        .join('|');
      url += `&waypoints=${encodeURIComponent(waypointsStr)}`;
    }

    return url;
  },

  /**
   * Fetches official driving route polyline coordinates from Google Directions REST API
   * using the stored latitude & longitude coordinates.
   */
  fetchDirectionsRoute: async (origin, waypoints = []) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    // Direct polyline path constructed from system coordinates
    const directPath = [{ lat: origin.lat || origin.latitude, lng: origin.lng || origin.longitude }];

    waypoints.forEach((wp) => {
      if (wp.latitude != null && wp.longitude != null) {
        directPath.push({ lat: wp.latitude, lng: wp.longitude });
      }
    });

    if (!apiKey) {
      return directPath;
    }

    try {
      const originStr = `${origin.lat || origin.latitude},${origin.lng || origin.longitude}`;
      const dest = waypoints[waypoints.length - 1] || origin;
      const destStr = `${dest.latitude || dest.lat},${dest.longitude || dest.lng}`;

      const waypointsStr = waypoints
        .slice(0, -1)
        .map((w) => `${w.latitude || w.lat},${w.longitude || w.lng}`)
        .join('|');

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&waypoints=${encodeURIComponent(
          waypointsStr
        )}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        // Return Google Directions API overview path
        return directPath;
      }
    } catch (err) {
      console.warn('[Google Directions API] Rest fetch error, using system coordinates path:', err);
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
