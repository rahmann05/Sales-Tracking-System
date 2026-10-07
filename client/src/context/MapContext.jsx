import { useMapMarkers } from './hooks/useMapMarkers';
import { useMapShapes } from './hooks/useMapShapes';
import { createMapMarker } from '../services/mapMarkerService';
import React, { createContext, useContext, useRef, useState, useCallback, useEffect, useMemo } from 'react';

const DEFAULT_CENTER = { lat: -6.88498411526505, lng: 107.48995363176957 };

const getInitialCenter = () => {
    try {
        const cached = localStorage.getItem('user_gps_location');
        if (cached) return JSON.parse(cached);
    } catch  {}
    return DEFAULT_CENTER;
};

const MapContext = createContext();

const GPS_BLUE_DOT_SVG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="14" fill="#3B82F6" fill-opacity="0.3"/>
  <circle cx="16" cy="16" r="7" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.5"/>
</svg>
`)}`;

/**
 * MapContext (Persistent Google Map Engine)
 * Single Responsibility: Hold the single google.maps.Map instance and expose
 * imperative APIs for markers / polylines so the map NEVER unmounts on tab switch.
 */
export const MapProvider = ({ children }) => {
    const mapInstanceRef = useRef(null);
    const markersRef = useRef(new Map());   // Map<string|number, marker adapter>
    const polylinesRef = useRef(new Map()); // Map<string|number, google.maps.Polyline>
    const polygonsRef = useRef(new Map());  // Map<string|number, google.maps.Polygon>
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
                gpsMarkerRef.current = createMapMarker({
                    position: location,
                    map,
                    title: 'Lokasi Anda (GPS)',
                    icon: {
                        url: GPS_BLUE_DOT_SVG,
                        scaledSize: new window.google.maps.Size(32, 32),
                        anchor: new window.google.maps.Point(16, 16)
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
            } catch  {}
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

    const { cullMarkersToViewport, setMarkers, addMarker, removeMarker, clearMarkers } = useMapMarkers({ mapInstanceRef, markersRef, setMapState });

    /** Called by PersistentMapShell when the underlying google map is created */
    const setMapInstance = useCallback((map) => {
        mapInstanceRef.current = map;
        setIsMapReady(!!map);

        if (map && window.google) {
            let timeout = null;
            map.addListener('idle', () => {
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(() => {
                    cullMarkersToViewport();
                }, 100);
            });
        }
    }, [cullMarkersToViewport]);

    const setFallback = useCallback((val) => setUseFallback(!!val), []);

    const { setPolylines, clearPolylines, setPolygons, clearPolygons } = useMapShapes({ mapInstanceRef, polylinesRef, polygonsRef, setMapState });

    // When Google Map instance becomes ready, sync any pending markers/routes stored in mapState
    useEffect(() => {
        if (!isMapReady || !mapInstanceRef.current || !window.google) return;
        if (mapState.markers.length > 0 && markersRef.current.size === 0) {
            setMarkers(mapState.markers);
        }
        if (mapState.routes.length > 0 && polylinesRef.current.size === 0) {
            setPolylines(mapState.routes);
        }
    }, [isMapReady, mapState.markers, mapState.routes, setMarkers, setPolylines]);

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

    const value = useMemo(
        () => ({
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
            setPolygons,
            clearPolygons,
            panTo,
            fitBounds,
            addClickListener,
            removeClickListener,
        }),
        [
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
            setPolygons,
            clearPolygons,
            panTo,
            fitBounds,
            addClickListener,
            removeClickListener,
        ]
    );

    return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMap = () => {
    const ctx = useContext(MapContext);
    if (!ctx) throw new Error('useMap must be used within MapProvider');
    return ctx;
};
