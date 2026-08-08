/**
 * Routing Service (Client)
 * Single Responsibility: Minta rute mengikuti jalan ke backend.
 * Backend menangani fallback Google Directions → OSRM.
 * API key Google tidak terekspos di client.
 * 1 File = 1 Pure Service
 */

export const routingService = {
    /**
     * Resolve rute mengikuti jalan via backend proxy.
     * @param {Array<{lat: number, lng: number}>} waypoints - Titik berurutan
     * @returns {Promise<{ legs: Array<{path, distanceKm, durationMin}>, provider: 'google'|'osrm' }>}
     */
    fetchRoadRoute: async (waypoints) => {
        const response = await fetch('/api/v1/routing/road-route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ waypoints }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || `Routing API Error: ${response.status}`);
        }

        return { legs: result.data.legs, provider: result.data.provider };
    },
};
