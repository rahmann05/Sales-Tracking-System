/**
 * Routing Service (Backend)
 * Single Responsibility: Orchestrate route resolution dengan fallback strategy.
 * Prioritas: Google Directions REST API → OSRM (open-source fallback).
 */

import { fetchGoogleLegs } from './googleDirectionsProvider.js';
import { fetchOsrmLegs } from './osrmProvider.js';

/**
 * Resolve rute per leg dengan fallback Google → OSRM
 * @param {Array} waypoints - Array of {lat, lng}
 * @returns {Promise<{legs: Array, provider: 'google'|'osrm'}>}
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
