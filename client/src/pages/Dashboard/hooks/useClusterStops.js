import { useMemo } from 'react';
import { filterStopsForToday } from '../../../utils/dateUtils';

const deg2rad = (d) => (d * Math.PI) / 180;

const haversineDistance = (a, bLat, bLng) => {
    const dLat = deg2rad(bLat - a.lat);
    const dLng = deg2rad(bLng - a.lng);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(a.lat)) * Math.cos(deg2rad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

// Urutkan stops dengan nearest-neighbor heuristic mulai dari lokasi sales
const sortByNearestNeighbor = (stops, startPoint) => {
    const remaining = [...stops];
    const sorted = [];
    let current = { lat: startPoint.lat, lng: startPoint.lng };

    while (remaining.length > 0) {
        let nearestIdx = 0;
        let nearestDist = haversineDistance(current, remaining[0].latitude, remaining[0].longitude);
        for (let i = 1; i < remaining.length; i++) {
            const d = haversineDistance(current, remaining[i].latitude, remaining[i].longitude);
            if (d < nearestDist) {
                nearestDist = d;
                nearestIdx = i;
            }
        }
        const nearest = remaining.splice(nearestIdx, 1)[0];
        sorted.push(nearest);
        current = { lat: nearest.latitude, lng: nearest.longitude };
    }

    return sorted;
};

/**
 * useClusterStops Hook
 * Single Responsibility: Seleksi stops berdasarkan role/seleksi sales + urutkan
 * dengan nearest-neighbor dari lokasi sales + bangun fallback polyline positions.
 * Peta SELALU memfilter stops ke jadwal HARI INI (semua role).
 * Sales role hanya menampilkan stops miliknya sendiri (klaster sendiri), sedangkan SPV/Manager dapat melihat semua klaster.
 */
export const useClusterStops = ({ allStops, selectedSales, isSalesRole, salesLocation, userName = 'Budi Santoso' }) => {
    const rawStops = useMemo(() => {
        if (isSalesRole) {
            const filtered = allStops.filter(
                (s) => !s.assignedSalesName || s.assignedSalesName === userName || s.assignedSalesName === 'Budi Santoso'
            );
            return filterStopsForToday(filtered.length > 0 ? filtered : allStops.slice(0, 10));
        }
        if (selectedSales && Array.isArray(selectedSales.stops)) return filterStopsForToday(selectedSales.stops);
        return filterStopsForToday(allStops);
    }, [allStops, selectedSales, isSalesRole, userName]);

    const systemStops = useMemo(() => {
        const validStops = rawStops.filter((s) => s.latitude != null && s.longitude != null);
        if (validStops.length === 0) return validStops;
        return sortByNearestNeighbor(validStops, salesLocation);
    }, [rawStops, salesLocation]);

    const polylinePositions = useMemo(() => {
        const points = [{ lat: salesLocation.lat, lng: salesLocation.lng }];
        systemStops.forEach((stop) => {
            if (stop.latitude != null && stop.longitude != null) {
                points.push({ lat: stop.latitude, lng: stop.longitude });
            }
        });
        return points;
    }, [salesLocation, systemStops]);

    return { systemStops, polylinePositions };
};
