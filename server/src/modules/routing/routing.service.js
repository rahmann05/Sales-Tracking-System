import {AppError} from '../../utils/errors.js';
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
    if(!Array.isArray(waypoints)||waypoints.length<2||waypoints.some(p=>!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||Math.abs(p.lat)>90||Math.abs(p.lng)>180))throw new AppError('Rute memerlukan koordinat lengkap pada setiap tujuan. Perbaiki lokasi outlet terlebih dahulu.',422);
    const provider=await getDynamicConfig('ROUTING_PROVIDER','AUTO'),fallback=await getDynamicConfig('ROUTING_ALLOW_FALLBACK',true);
    if(provider==='OFF'||await getDynamicConfig('FEATURE_MAPS_MODE','ACTIVE')!=='ACTIVE')throw new AppError('Layanan rute jalan dinonaktifkan Admin',403);
    let apiKey = config.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY;
    try {
        const dynamicKey = await getDynamicConfig('MAPS_API_KEY', apiKey);
        if (dynamicKey) apiKey = dynamicKey;
    } catch {}

    if (apiKey && provider!=='OSRM') {
        try {
            const legs = await fetchGoogleLegs(waypoints, apiKey);
            return { legs, provider: 'google' };
        } catch (err) {
            if(provider==='GOOGLE'&&!fallback||!fallback)throw err;
            console.warn('[routingService] Google Directions/Routes API gagal, fallback OSRM:', err.message);
        }
    } else {
        console.info('[routingService] GOOGLE_MAPS_API_KEY tidak diset — langsung pakai OSRM.');
    }

    if(provider==='GOOGLE'&&!fallback)throw new AppError('Google Maps belum tersedia dan rute cadangan dinonaktifkan',503);
    try {
        const legs = await fetchOsrmLegs(waypoints);
        return { legs, provider: 'osrm' };
    } catch (err) {
        console.error('[routingService] OSRM fallback juga gagal:', err.message);
        throw err;
    }
};
