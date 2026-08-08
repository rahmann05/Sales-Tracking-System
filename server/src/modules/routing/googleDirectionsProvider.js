/**
 * Google Directions Provider
 * Single Responsibility: Fetch route legs dari Google Directions REST API.
 */

import { decodePolyline } from './polylineDecoder.js';

const GOOGLE_DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';
const GOOGLE_TIMEOUT_MS = 8000;

/**
 * Build URL untuk Google Directions API request
 */
const buildDirectionsUrl = (waypoints, apiKey) => {
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const midPoints = waypoints.slice(1, -1);

    let url = `${GOOGLE_DIRECTIONS_URL}?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving&key=${apiKey}`;

    if (midPoints.length > 0) {
        const wp = midPoints.map((p) => `${p.lat},${p.lng}`).join('|');
        url += `&waypoints=${encodeURIComponent(wp)}`;
    }

    return url;
};

/**
 * Parse single leg dari Google Directions response
 */
const parseLeg = (leg, route) => ({
    path: leg.steps
        ? leg.steps.flatMap((s) => decodePolyline(s.polyline.points))
        : decodePolyline(route.overview_polyline.points),
    distanceKm: Number(((leg.distance?.value || 0) / 1000).toFixed(1)),
    durationMin: Math.round((leg.duration?.value || 0) / 60),
});

/**
 * Fetch route legs dari Google Directions REST API
 * @param {Array} waypoints - Array of {lat, lng}
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<Array>} Array of legs [{path, distanceKm, durationMin}]
 */
export const fetchGoogleLegs = async (waypoints, apiKey) => {
    const url = buildDirectionsUrl(waypoints, apiKey);
    const response = await fetch(url, { signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS) });
    const data = await response.json();

    if (data.status !== 'OK' || !data.routes?.[0]?.legs) {
        throw new Error(`Google Directions: ${data.status}`);
    }

    return data.routes[0].legs.map((leg) => parseLeg(leg, data.routes[0]));
};
