import { useState, useEffect } from 'react';

const WAYPOINT_CHUNK_SIZE = 12; // batas aman waypoint Google DirectionsService

const requestRouteChunk = (directionsService, origin, destination, waypoints) =>
    new Promise((resolve, reject) => {
        directionsService.route(
            {
                origin,
                destination,
                waypoints,
                travelMode: window.google.maps.TravelMode.DRIVING,
                optimizeWaypoints: false,
            },
            (res, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) resolve(res);
                else reject(status);
            }
        );
    });

/**
 * useRoadDirections Hook
 * Single Responsibility: Fetch real driving road-network path dari Google DirectionsService
 * (dengan chunking waypoint) dan expose status untuk fallback polyline.
 */
export const useRoadDirections = ({ isLoaded, apiKey, salesLocation, systemStops }) => {
    const [roadNetworkPath, setRoadNetworkPath] = useState([]);
    const [directionsStatus, setDirectionsStatus] = useState(null); // 'OK' | 'ERROR' | 'NO_KEY' | null

    useEffect(() => {
        if (typeof window === 'undefined' || !window.google || !isLoaded || systemStops.length === 0) return;

        if (!apiKey) {
            console.warn('[DirectionsService] No VITE_GOOGLE_MAPS_API_KEY set – falling back to straight-line polyline.');
            setDirectionsStatus('NO_KEY');
            setRoadNetworkPath([]);
            return;
        }

        const validStops = systemStops.filter((s) => s.latitude != null && s.longitude != null);
        if (validStops.length === 0) return;

        let isSubscribed = true;
        const directionsService = new window.google.maps.DirectionsService();

        const fetchRoadRoutes = async () => {
            const allPoints = [];
            let currentOrigin = { lat: Number(salesLocation.lat), lng: Number(salesLocation.lng) };

            for (let i = 0; i < validStops.length; i += WAYPOINT_CHUNK_SIZE) {
                if (!isSubscribed) break;

                const chunk = validStops.slice(i, i + WAYPOINT_CHUNK_SIZE);
                const chunkLast = chunk[chunk.length - 1];
                const destination = { lat: Number(chunkLast.latitude), lng: Number(chunkLast.longitude) };
                const waypoints = chunk.slice(0, -1).map((s) => ({
                    location: { lat: Number(s.latitude), lng: Number(s.longitude) },
                    stopover: true,
                }));

                try {
                    const result = await requestRouteChunk(directionsService, currentOrigin, destination, waypoints);
                    result?.routes?.[0]?.overview_path?.forEach((pt) => {
                        allPoints.push({ lat: pt.lat(), lng: pt.lng() });
                    });
                } catch (errStatus) {
                    console.warn('[DirectionsService] Route chunk status:', errStatus);
                }

                currentOrigin = destination;
            }

            if (isSubscribed) {
                if (allPoints.length > 0) {
                    setRoadNetworkPath(allPoints);
                    setDirectionsStatus('OK');
                } else {
                    setRoadNetworkPath([]);
                    setDirectionsStatus('ERROR');
                }
            }
        };

        fetchRoadRoutes();
        return () => {
            isSubscribed = false;
        };
    }, [isLoaded, apiKey, salesLocation, systemStops]);

    return { roadNetworkPath, directionsStatus };
};
