import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

const DEFAULT_CENTER = { lat: -6.88498411526505, lng: 107.48995363176957 };

const getInitialCenter = () => {
    try {
        const cached = localStorage.getItem('user_gps_location');
        if (cached) return JSON.parse(cached);
    } catch (e) {}
    return DEFAULT_CENTER;
};

const MapContext = createContext();

/**
 * MapContext (Persistent Google Map Engine)
 * Single Responsibility: Hold the single google.maps.Map instance and expose
 * imperative APIs for markers / polylines so the map NEVER unmounts on tab switch.
 */
export const MapProvider = ({ children }) => {
    const mapInstanceRef = useRef(null);
    const markersRef = useRef(new Map());   // Map<string|number, google.maps.Marker>
    const polylinesRef = useRef(new Map()); // Map<string|number, google.maps.Polyline>
    const clickListenerRef = useRef(null);
    const gpsMarkerRef = useRef(null);

    const [isMapReady, setIsMapReady] = useState(false);
    const [useFallback, setUseFallback] = useState(false);

    // mapState driven by PersistentMapShell (center/zoom) — kept here so pages can read it
    const [mapState, setMapState] = useState({
        center: getInitialCenter(),
        zoom: 11,
        markers: [],
        routes: [],
    });

    // 'hidden' | 'dashboard' | 'create-cluster' | 'route-map'
    const [mapMode, setMapMode] = useState('hidden');

    useEffect(() => {
        const updateGpsMarker = (location) => {
            const map = mapInstanceRef.current;
            if (!map || !window.google) return;

            if (!gpsMarkerRef.current) {
                gpsMarkerRef.current = new window.google.maps.Marker({
                    position: location,
                    map,
                    title: 'Lokasi Anda (GPS)',
                    icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' // Different icon for user GPS
                    },
                    zIndex: 1000 // Ensure it's on top
                });
            } else {
                gpsMarkerRef.current.setPosition(location);
            }
        };

        // Initialize from cache if map just became ready
        if (isMapReady) {
            try {
                const cached = localStorage.getItem('user_gps_location');
                if (cached) {
                    const loc = JSON.parse(cached);
                    updateGpsMarker(loc);
                }
            } catch (e) {}
        }

        const handleGpsUpdate = (e) => {
            if (e.detail) {
                setMapState(prev => ({ ...prev, center: e.detail }));
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.panTo(e.detail);
                }
                updateGpsMarker(e.detail);
            }
        };
        window.addEventListener('gps_location_updated', handleGpsUpdate);
        return () => window.removeEventListener('gps_location_updated', handleGpsUpdate);
    }, [isMapReady]);

    /** Called by PersistentMapShell when the underlying google map is created */
    const setMapInstance = useCallback((map) => {
        mapInstanceRef.current = map;
        setIsMapReady(!!map);
    }, []);

    const setFallback = useCallback((val) => setUseFallback(!!val), []);

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
            const existing = markersRef.current.get(key);
            if (existing) {
                existing.setPosition(position);
                if (m.icon !== undefined) existing.setIcon(m.icon);
                if (m.title !== undefined) existing.setTitle(m.title);
                if (m.label !== undefined) existing.setLabel(m.label);
                if (m.zIndex !== undefined) existing.setZIndex(m.zIndex);
            } else {
                const marker = new window.google.maps.Marker({
                    position,
                    map,
                    title: m.title,
                    icon: m.icon,
                    label: m.label,
                    zIndex: m.zIndex,
                });
                if (typeof m.onClick === 'function') {
                    marker.addListener('click', () => m.onClick(m));
                }
                markersRef.current.set(key, marker);
            }
        });
    }, []);

    const addMarker = useCallback((markerData) => {
        if (!markerData) return;
        setMapState((prev) => ({ ...prev, markers: [...prev.markers.filter(x => String(x.id) !== String(markerData.id)), markerData] }));
        const map = mapInstanceRef.current;
        if (!map || !window.google) return;
        const key = String(markerData.id);
        if (markersRef.current.has(key)) return;
        const marker = new window.google.maps.Marker({
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

    /** Replace all polylines. routesData: [{id, path:[{lat,lng}], color, isActive, strokeWeight, strokeOpacity}] */
    const setPolylines = useCallback((routesData = []) => {
        setMapState((prev) => ({ ...prev, routes: routesData }));

        const map = mapInstanceRef.current;
        if (!map || !window.google) return;

        const nextIds = new Set(routesData.map((r, i) => String(r.id ?? i)));
        for (const [id, poly] of polylinesRef.current.entries()) {
            if (!nextIds.has(String(id))) {
                poly.setMap(null);
                polylinesRef.current.delete(id);
            }
        }

        routesData.forEach((r, i) => {
            const key = String(r.id ?? i);
            const path = (r.path || []).map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) }));
            const opts = {
                path,
                map,
                strokeColor: r.color || '#4ade80',
                strokeOpacity: r.strokeOpacity ?? (r.isActive ? 1.0 : 0.4),
                strokeWeight: r.strokeWeight ?? (r.isActive ? 4 : 2),
                zIndex: r.isActive ? 10 : 1,
            };
            const existing = polylinesRef.current.get(key);
            if (existing) {
                existing.setOptions(opts);
            } else {
                polylinesRef.current.set(key, new window.google.maps.Polyline(opts));
            }
        });
    }, []);

    const clearPolylines = useCallback(() => {
        setMapState((prev) => ({ ...prev, routes: [] }));
        for (const poly of polylinesRef.current.values()) poly.setMap(null);
        polylinesRef.current.clear();
    }, []);

    const panTo = useCallback((lat, lng, zoom) => {
        const center = { lat: Number(lat), lng: Number(lng) };
        setMapState((prev) => ({ ...prev, center, ...(zoom ? { zoom } : {}) }));
        const map = mapInstanceRef.current;
        if (!map) return;
        map.panTo(center);
        if (zoom) map.setZoom(zoom);
    }, []);

    const fitBounds = useCallback((points = []) => {
        const map = mapInstanceRef.current;
        if (!map || !window.google || points.length === 0) return;
        const bounds = new window.google.maps.LatLngBounds();
        points.forEach((p) => bounds.extend({ lat: Number(p.lat), lng: Number(p.lng) }));
        map.fitBounds(bounds);
    }, []);

    const addClickListener = useCallback((handler) => {
        const map = mapInstanceRef.current;
        if (!map || !window.google || typeof handler !== 'function') return;
        if (clickListenerRef.current) clickListenerRef.current.remove();
        clickListenerRef.current = map.addListener('click', (e) => {
            handler({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });
    }, []);

    const removeClickListener = useCallback(() => {
        if (clickListenerRef.current) {
            clickListenerRef.current.remove();
            clickListenerRef.current = null;
        }
    }, []);

    const value = {
        mapInstanceRef,
        isMapReady,
        useFallback,
        setFallback,
        setMapInstance,
        mapState,
        setMapState,
        mapMode,
        setMapMode,
        setMarkers,
        addMarker,
        removeMarker,
        clearMarkers,
        setPolylines,
        clearPolylines,
        panTo,
        fitBounds,
        addClickListener,
        removeClickListener,
    };

    return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMap = () => {
    const ctx = useContext(MapContext);
    if (!ctx) throw new Error('useMap must be used within MapProvider');
    return ctx;
};
