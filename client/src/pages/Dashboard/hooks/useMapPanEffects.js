import { useEffect } from 'react';

/**
 * useMapPanEffects Hook
 * Single Responsibility: Handle pan & zoom effects pada Google Maps berdasarkan selection changes.
 */
export const useMapPanEffects = ({ mapRef, selectedOutlet, selectedSales, setActiveMarkerStop }) => {
    // Pan & zoom ke outlet yang dipilih
    useEffect(() => {
        if (mapRef.current && selectedOutlet?.latitude != null && selectedOutlet?.longitude != null) {
            mapRef.current.panTo({ lat: Number(selectedOutlet.latitude), lng: Number(selectedOutlet.longitude) });
            mapRef.current.setZoom(15);
            setActiveMarkerStop(selectedOutlet);
        }
    }, [mapRef, selectedOutlet, setActiveMarkerStop]);

    // Pan ke rute sales saat selectedSales berubah
    useEffect(() => {
        if (mapRef.current && selectedSales?.stops?.length > 0) {
            const firstStop = selectedSales.stops[0];
            if (firstStop?.latitude != null && firstStop?.longitude != null) {
                mapRef.current.panTo({ lat: Number(firstStop.latitude), lng: Number(firstStop.longitude) });
                mapRef.current.setZoom(13);
            }
        }
    }, [mapRef, selectedSales]);
};
