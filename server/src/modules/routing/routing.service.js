/**
 * Routing Service (Backend)
 * Single Responsibility: Resolve rute mengikuti jalan per leg (titik → titik).
 * Prioritas: Google Directions REST API → OSRM (open-source fallback).
 * API key Google aman di server (tidak terekspos ke client & bebas CORS).
 */

const GOOGLE_DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

const decodePolyline = (encoded) => {
    const points = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
        let shift = 0, result = 0, byte;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        lat += result & 1 ? ~(result >> 1) : result >> 1;

        shift = 0; result = 0;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        lng += result & 1 ? ~(result >> 1) : result >> 1;

        points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return points;
};

/** Google Directions REST: return legs [{path, distanceKm, durationMin}] */
const fetchGoogleLegs = async (waypoints, apiKey) => {
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const midPoints = waypoints.slice(1, -1);

    let url = `${GOOGLE_DIRECTIONS_URL}?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving&key=${apiKey}`;
    if (midPoints.length > 0) {
        const wp = midPoints.map((p) => `${p.lat},${p.lng}`).join('|');
        url += `&waypoints=${encodeURIComponent(wp)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.routes?.[0]?.legs) {
        throw new Error(`Google Directions: ${data.status}`);
    }

    return data.routes[0].legs.map((leg) => ({
        path: leg.steps
            ? leg.steps.flatMap((s) => decodePolyline(s.polyline.points))
            : decodePolyline(data.routes[0].overview_polyline.points),
        distanceKm: Number(((leg.distance?.value || 0) / 1000).toFixed(1)),
        durationMin: Math.round((leg.duration?.value || 0) / 60),
    }));
};

/**
 * OSRM: geometry rute ada di routes[0].geometry (full), bukan per leg.
 * legs[] hanya berisi distance/duration/summary saat steps=false.
 * Kita split full geometry per leg berdasarkan proporsi distance kumulatif.
 * Return legs [{path, distanceKm, durationMin}]
 */
const fetchOsrmLegs = async (waypoints) => {
    const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(';');
    const url = `${OSRM_BASE_URL}/${coords}?overview=full&geometries=geojson&steps=false`;

    const response = await fetch(url);
    const data = await response.json();

    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route?.legs || !route.geometry?.coordinates) {
        throw new Error(`OSRM: ${data.code || 'error'}`);
    }

    const allCoords = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    const totalPoints = allCoords.length;
    const totalDistance = route.legs.reduce((sum, l) => sum + (l.distance || 0), 0);

    let startIdx = 0;
    return route.legs.map((leg, i) => {
        // Alokasikan porsi titik geometry berdasarkan proporsi distance leg
        const ratio = totalDistance > 0 ? (leg.distance || 0) / totalDistance : 1 / route.legs.length;
        let count = Math.round(ratio * totalPoints);
        // Pastikan leg terakhir menampung sisa titik sampai akhir
        if (i === route.legs.length - 1) count = totalPoints - startIdx;
        count = Math.max(count, 2);

        const path = allCoords.slice(startIdx, startIdx + count);
        startIdx += count - 1; // overlap 1 titik agar garis nyambung antar leg

        return {
            path,
            distanceKm: Number(((leg.distance || 0) / 1000).toFixed(1)),
            durationMin: Math.round((leg.duration || 0) / 60),
        };
    });
};

/**
 * Resolve rute per leg dengan fallback Google → OSRM.
 * @returns {{ legs: Array<{path, distanceKm, durationMin}>, provider: 'google'|'osrm' }}
 */
export const resolveRoadRoute = async (waypoints) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (apiKey) {
        try {
            const legs = await fetchGoogleLegs(waypoints, apiKey);
            return { legs, provider: 'google' };
        } catch (err) {
            console.warn('[routingService] Google Directions gagal, fallback OSRM:', err.message);
        }
    }

    const legs = await fetchOsrmLegs(waypoints);
    return { legs, provider: 'osrm' };
};
