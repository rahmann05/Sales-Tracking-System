/**
 * Google Directions / Routes Provider
 * Single Responsibility: Fetch route legs from Google Routes API v2 (modern)
 * with graceful fallback to legacy Google Directions REST API.
 */

import { decodePolyline } from './polylineDecoder.js';

const GOOGLE_ROUTES_V2_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const GOOGLE_DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';
const GOOGLE_TIMEOUT_MS = 8000;

/**
 * Fetch route legs using modern Google Routes API v2
 */
const fetchRoutesV2Legs = async (waypoints, apiKey) => {
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const midPoints = waypoints.slice(1, -1);

    const body = {
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode: 'DRIVE',
    };

    if (midPoints.length > 0) {
        body.intermediates = midPoints.map((p) => ({
            location: { latLng: { latitude: p.lat, longitude: p.lng } },
        }));
    }

    const response = await fetch(GOOGLE_ROUTES_V2_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.legs.distanceMeters,routes.legs.duration,routes.legs.polyline.encodedPolyline,routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Routes API v2 HTTP ${response.status}: ${errorText.slice(0, 150)}`);
    }

    const data = await response.json();
    const route = data.routes?.[0];
    if (!route) {
        throw new Error('Google Routes API v2 returned empty routes');
    }

    if (route.legs && route.legs.length > 0) {
        return route.legs.map((leg) => {
            const encoded = leg.polyline?.encodedPolyline || route.polyline?.encodedPolyline || '';
            const path = encoded ? decodePolyline(encoded) : [];
            const durationSec = parseInt(leg.duration || '0', 10);
            return {
                path,
                distanceKm: Number(((leg.distanceMeters || 0) / 1000).toFixed(1)),
                durationMin: Math.round(durationSec / 60),
            };
        });
    }

    const encoded = route.polyline?.encodedPolyline || '';
    const path = encoded ? decodePolyline(encoded) : [];
    const durationSec = parseInt(route.duration || '0', 10);
    return [{
        path,
        distanceKm: Number(((route.distanceMeters || 0) / 1000).toFixed(1)),
        durationMin: Math.round(durationSec / 60),
    }];
};

/**
 * Build URL for legacy Google Directions API request (fallback)
 */
const buildLegacyDirectionsUrl = (waypoints, apiKey) => {
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

const parseLegacyLeg = (leg, route) => ({
    path: leg.steps
        ? leg.steps.flatMap((s) => decodePolyline(s.polyline.points))
        : decodePolyline(route.overview_polyline.points),
    distanceKm: Number(((leg.distance?.value || 0) / 1000).toFixed(1)),
    durationMin: Math.round((leg.duration?.value || 0) / 60),
});

/**
 * Fetch route legs from Google Routes API v2 with legacy Directions fallback
 * @param {Array} waypoints - Array of {lat, lng}
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<Array>} Array of legs [{path, distanceKm, durationMin}]
 */
export const fetchGoogleLegs = async (waypoints, apiKey) => {
    try {
        return await fetchRoutesV2Legs(waypoints, apiKey);
    } catch (v2Error) {
        console.warn('[routingService] Google Routes API v2 error, trying legacy Directions API:', v2Error.message);
        const url = buildLegacyDirectionsUrl(waypoints, apiKey);
        const response = await fetch(url, { signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS) });
        const data = await response.json();

        if (data.status !== 'OK' || !data.routes?.[0]?.legs) {
            throw new Error(`Google Directions: ${data.status} (v2: ${v2Error.message})`);
        }

        return data.routes[0].legs.map((leg) => parseLegacyLeg(leg, data.routes[0]));
    }
};
