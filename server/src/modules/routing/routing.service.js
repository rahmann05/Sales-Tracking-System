/**
 * Routing Service (Backend)
 * Single Responsibility: Orchestrate route resolution dengan fallback strategy.
 * Prioritas: Google Directions REST API → OSRM (open-source fallback).
 * Jika GOOGLE_MAPS_API_KEY kosong / request gagal / quota habis → otomatis OSRM.
 */

import { fetchGoogleLegs } from './googleDirectionsProvider.js';
import { fetchOsrmLegs } from './osrmProvider.js';
import { config } from '../../config/index.js';
import { getDynamicConfig } from '../config/config.service.js';

/**
 * Resolve rute per leg dengan fallback Google → OSRM
 * @param {Array} waypoints - Array of {lat, lng}
 * @returns {Promise<{legs: Array, provider: 'google'|'osrm'}>}
 */
export const resolveRoadRoute = async (waypoints) => {
    let apiKey = config.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY;
    try {
        const dynamicKey = await getDynamicConfig('MAPS_API_KEY', apiKey);
        if (dynamicKey) apiKey = dynamicKey;
    } catch {}

    if (apiKey) {
        try {
            const legs = await fetchGoogleLegs(waypoints, apiKey);
            return { legs, provider: 'google' };
        } catch (err) {
            console.warn('[routingService] Google Directions/Routes API gagal, fallback OSRM:', err.message);
        }
    } else {
        console.info('[routingService] GOOGLE_MAPS_API_KEY tidak diset — langsung pakai OSRM.');
    }

    try {
        const legs = await fetchOsrmLegs(waypoints);
        return { legs, provider: 'osrm' };
    } catch (err) {
        console.error('[routingService] OSRM fallback juga gagal:', err.message);
        throw err;
    }
};
