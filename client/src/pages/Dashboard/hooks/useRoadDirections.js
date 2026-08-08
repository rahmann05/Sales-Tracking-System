import { useState, useEffect } from 'react';
import { routingService } from '../../../services/routingService';

const deg2rad = (d) => (d * Math.PI) / 180;
const EARTH_RADIUS_KM = 6371;

/** Haversine distance (km) antara 2 titik — untuk fallback garis lurus */
const haversineKm = (a, b) => {
    const dLat = deg2rad(b.lat - a.lat);
    const dLng = deg2rad(b.lng - a.lng);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(a.lat)) * Math.cos(deg2rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

const requestDirections = (directionsService, origin, destination) =>
    new Promise((resolve, reject) => {
        directionsService.route(
            { origin, destination, travelMode: window.google.maps.TravelMode.DRIVING },
            (res, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) resolve(res);
                else reject(new Error(status));
            }
        );
    });

/** Fetch 1 leg via Google Maps JS SDK → {path, distanceKm, durationMin} */
const fetchSdkLeg = async (directionsService, origin, destination) => {
    const result = await requestDirections(directionsService, origin, destination);
    const leg = result?.routes?.[0]?.legs?.[0];
    const path = result?.routes?.[0]?.overview_path?.map((pt) => ({ lat: pt.lat(), lng: pt.lng() })) || [];
    return {
        path,
        distanceKm: Number(((leg?.distance?.value || 0) / 1000).toFixed(1)),
        durationMin: Math.round((leg?.duration?.value || 0) / 60),
    };
};

const CONCURRENT_LEGS = 3;

/**
 * useRoadDirections Hook
 * Single Responsibility: Resolve rute mengikuti jalan sebagai legs terpisah
 * (1 leg = garis dari 1 titik ke titik berikutnya, dengan jarak & durasi sendiri).
 *
 * Strategi berlapis (utama → fallback):
 *   1. Google DirectionsService (JS SDK) per leg
 *   2. Backend proxy /api/v1/routing/road-route (Google REST → OSRM)
 *   3. Garis lurus per leg + jarak haversine
 */
export const useRoadDirections = ({ isLoaded, salesLocation, systemStops }) => {
    const [routeLegs, setRouteLegs] = useState([]);
    const [routeProvider, setRouteProvider] = useState(null); // 'GOOGLE' | 'GOOGLE_API' | 'OSRM' | 'FALLBACK' | null

    useEffect(() => {
        if (!isLoaded || systemStops.length === 0) return;

        const validStops = systemStops.filter((s) => s.latitude != null && s.longitude != null);
        if (validStops.length === 0) return;

        const waypoints = [
            { lat: Number(salesLocation.lat), lng: Number(salesLocation.lng) },
            ...validStops.map((s) => ({ lat: Number(s.latitude), lng: Number(s.longitude) })),
        ];

        let isSubscribed = true;

        const resolveLegs = async () => {
            // 1. Google JS SDK per leg (client-side)
            if (typeof window !== 'undefined' && window.google) {
                try {
                    const directionsService = new window.google.maps.DirectionsService();
                    const pairs = waypoints.slice(0, -1).map((origin, i) => ({
                        origin,
                        destination: waypoints[i + 1],
                    }));

                    const legs = [];
                    for (let i = 0; i < pairs.length; i += CONCURRENT_LEGS) {
                        const batch = pairs.slice(i, i + CONCURRENT_LEGS);
                        const results = await Promise.all(
                            batch.map((p) => fetchSdkLeg(directionsService, p.origin, p.destination))
                        );
                        legs.push(...results);
                    }

                    if (legs.some((l) => l.path.length > 0) && isSubscribed) {
                        setRouteLegs(legs);
                        setRouteProvider('GOOGLE');
                        return;
                    }
                } catch (err) {
                    console.warn('[useRoadDirections] Google SDK gagal, coba backend proxy:', err.message);
                }
            }

            // 2. Backend proxy (Google REST → OSRM)
            try {
                const { legs, provider } = await routingService.fetchRoadRoute(waypoints);
                if (legs?.some((l) => l.path.length > 0) && isSubscribed) {
                    setRouteLegs(legs);
                    setRouteProvider(provider === 'google' ? 'GOOGLE_API' : 'OSRM');
                    return;
                }
            } catch (err) {
                console.warn('[useRoadDirections] Backend proxy gagal:', err.message);
            }

            // 3. Garis lurus per leg + jarak haversine
            if (isSubscribed) {
                const straightLegs = waypoints.slice(0, -1).map((origin, i) => {
                    const destination = waypoints[i + 1];
                    return {
                        path: [origin, destination],
                        distanceKm: Number(haversineKm(origin, destination).toFixed(1)),
                        durationMin: 0,
                    };
                });
                setRouteLegs(straightLegs);
                setRouteProvider('FALLBACK');
            }
        };

        resolveLegs();
        return () => {
            isSubscribed = false;
        };
    }, [isLoaded, salesLocation, systemStops]);

    return { routeLegs, routeProvider };
};
