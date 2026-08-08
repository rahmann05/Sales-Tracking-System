/**
 * OSRM Provider
 * Single Responsibility: Fetch route legs dari OSRM (Open Source Routing Machine) API.
 */

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Split full geometry per leg berdasarkan proporsi distance kumulatif
 */
const splitGeometryPerLeg = (allCoords, legs) => {
    const totalPoints = allCoords.length;
    const totalDistance = legs.reduce((sum, l) => sum + (l.distance || 0), 0);
    let startIdx = 0;

    return legs.map((leg, i) => {
        const ratio = totalDistance > 0 ? (leg.distance || 0) / totalDistance : 1 / legs.length;
        let count = Math.round(ratio * totalPoints);

        // Leg terakhir menampung sisa titik sampai akhir
        if (i === legs.length - 1) {
            count = totalPoints - startIdx;
        }
        count = Math.max(count, 2);

        const path = allCoords.slice(startIdx, startIdx + count);
        startIdx += count - 1; // Overlap 1 titik agar garis nyambung antar leg

        return {
            path,
            distanceKm: Number(((leg.distance || 0) / 1000).toFixed(1)),
            durationMin: Math.round((leg.duration || 0) / 60),
        };
    });
};

/**
 * Fetch route legs dari OSRM API
 * @param {Array} waypoints - Array of {lat, lng}
 * @returns {Promise<Array>} Array of legs [{path, distanceKm, durationMin}]
 */
export const fetchOsrmLegs = async (waypoints) => {
    const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(';');
    const url = `${OSRM_BASE_URL}/${coords}?overview=full&geometries=geojson&steps=false`;

    const response = await fetch(url);
    const data = await response.json();

    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route?.legs || !route.geometry?.coordinates) {
        throw new Error(`OSRM: ${data.code || 'error'}`);
    }

    const allCoords = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    return splitGeometryPerLeg(allCoords, route.legs);
};
