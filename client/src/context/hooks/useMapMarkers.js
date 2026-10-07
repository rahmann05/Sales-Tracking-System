import { useCallback } from 'react';
import { createMapMarker } from '../../services/mapMarkerService';
export const useMapMarkers = ({ mapInstanceRef, markersRef, setMapState }) => {
    // Viewport-based marker culling for zero-lag rendering when marker count is large
    const cullMarkersToViewport = useCallback(() => {
        const map = mapInstanceRef.current;
        if (!map || !window.google || markersRef.current.size <= 40) return;
        const bounds = map.getBounds();
        if (!bounds) return;

        // Buffer bounds by ~15% for smooth panning without visual pop-in
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const latSpan = Math.abs(ne.lat() - sw.lat()) * 0.15;
        const lngSpan = Math.abs(ne.lng() - sw.lng()) * 0.15;

        const expandedBounds = new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(sw.lat() - latSpan, sw.lng() - lngSpan),
            new window.google.maps.LatLng(ne.lat() + latSpan, ne.lng() + lngSpan)
        );

        markersRef.current.forEach((marker) => {
            const pos = marker.getPosition();
            if (!pos) return;
            // Always keep highlighted or active markers visible
            if (marker._isHighlighted) {
                if (marker.getMap() !== map) marker.setMap(map);
                return;
            }
            const inView = expandedBounds.contains(pos);
            if (inView && marker.getMap() !== map) {
                marker.setMap(map);
            } else if (!inView && marker.getMap() !== null) {
                marker.setMap(null);
            }
        });
    }, []);

    /** Replace all markers. markersData: [{id, lat, lng, title, icon, label, zIndex, onClick}] */
    const setMarkers = useCallback((markersData = []) => {
        setMapState((prev) => ({ ...prev, markers: markersData }));

        const map = mapInstanceRef.current;
        if (!map || !window.google) return;

        // Remove markers that are no longer present
        const nextIds = new Set(markersData.map((m) => String(m.id)));
        for (const [id, marker] of markersRef.current.entries()) {
            if (!nextIds.has(String(id))) {
                marker.setMap(null);
                markersRef.current.delete(id);
            }
        }

        // Upsert markers
        markersData.forEach((m) => {
            const key = String(m.id);
            const position = { lat: Number(m.lat), lng: Number(m.lng) };
            const isHigh = Boolean(m._highlighted || m.highlighted || (m.zIndex && m.zIndex > 10));
            const existing = markersRef.current.get(key);
            if (existing) {
                existing._isHighlighted = isHigh;
                existing.setPosition(position);
                if (m.icon !== undefined) existing.setIcon(m.icon);
                if (m.title !== undefined) existing.setTitle(m.title);
                if (m.label !== undefined) existing.setLabel(m.label);
                if (m.zIndex !== undefined) existing.setZIndex(m.zIndex);
                // Always re-register onClick so stale step/handler closures are never stuck
                existing.clearClickListeners();
                if (typeof m.onClick === 'function') {
                    existing.addListener('click', () => m.onClick(m));
                }
            } else {
                const marker = createMapMarker({
                    position,
                    map,
                    title: m.title,
                    icon: m.icon,
                    label: m.label,
                    zIndex: m.zIndex,
                });
                marker._isHighlighted = isHigh;
                if (typeof m.onClick === 'function') {
                    marker.addListener('click', () => m.onClick(m));
                }
                markersRef.current.set(key, marker);
            }
        });

        // Cull markers outside viewport if count is large
        cullMarkersToViewport();
    }, [cullMarkersToViewport]);

    const addMarker = useCallback((markerData) => {
        if (!markerData) return;
        setMapState((prev) => ({ ...prev, markers: [...prev.markers.filter(x => String(x.id) !== String(markerData.id)), markerData] }));
        const map = mapInstanceRef.current;
        if (!map || !window.google) return;
        const key = String(markerData.id);
        if (markersRef.current.has(key)) return;
        const marker = createMapMarker({
            position: { lat: Number(markerData.lat), lng: Number(markerData.lng) },
            map,
            title: markerData.title,
            icon: markerData.icon,
            label: markerData.label,
            zIndex: markerData.zIndex,
        });
        if (typeof markerData.onClick === 'function') {
            marker.addListener('click', () => markerData.onClick(markerData));
        }
        markersRef.current.set(key, marker);
    }, []);

    const removeMarker = useCallback((id) => {
        setMapState((prev) => ({ ...prev, markers: prev.markers.filter((m) => String(m.id) !== String(id)) }));
        const key = String(id);
        const marker = markersRef.current.get(key);
        if (marker) {
            marker.setMap(null);
            markersRef.current.delete(key);
        }
    }, []);

    const clearMarkers = useCallback(() => {
        setMapState((prev) => ({ ...prev, markers: [] }));
        for (const marker of markersRef.current.values()) marker.setMap(null);
        markersRef.current.clear();
    }, []);


return { cullMarkersToViewport, setMarkers, addMarker, removeMarker, clearMarkers };
};
