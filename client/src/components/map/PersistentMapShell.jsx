import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from '../../context/MapContext';
import { configApi } from '../../services/api';
import { LeafletFallbackRouteMap } from '../../pages/Dashboard/components/LeafletFallbackRouteMap';
import '../../styles/components/PersistentMapShell.css';

const DEFAULT_CENTER = { lat: -6.2, lng: 106.816666 };

/**
 * Load the Google Maps JS API exactly once.
 */
const loadGoogleMapsScript = (apiKey) =>
  new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve(window.google.maps);
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = reject;
    document.head.appendChild(script);
  });

/**
 * PersistentMapShell
 * Renders the ONE google map instance for the entire app lifetime.
 * It never unmounts — visibility is toggled via CSS (`visibility` / z-index)
 * based on `mapMode` from MapContext.
 */
export const PersistentMapShell = () => {
  const containerRef = useRef(null);
  const initRef = useRef(false);

  const {
    mapInstanceRef,
    setMapInstance,
    setFallback,
    useFallback,
    mapMode,
    mapState,
    setMapState,
    isMapReady,
  } = useMap();

  const [apiKey, setApiKey] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);

  // Fetch API key once
  useEffect(() => {
    let mounted = true;
    const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    configApi
      .getByKey('MAPS_API_KEY')
      .then((res) => {
        if (mounted && res?.data?.value) setApiKey(res.data.value);
        else if (mounted && envKey) setApiKey(envKey);
        else if (mounted) setLoadFailed(true);
      })
      .catch(() => {
        if (mounted && envKey) setApiKey(envKey);
        else if (mounted) setLoadFailed(true);
      });
    return () => { mounted = false; };
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!apiKey || initRef.current || !containerRef.current) return;
    initRef.current = true;

    loadGoogleMapsScript(apiKey)
      .then(() => {
        const map = new window.google.maps.Map(containerRef.current, {
          center: mapState?.center || DEFAULT_CENTER,
          zoom: mapState?.zoom || 11,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        });
        setMapInstance(map);
      })
      .catch((err) => {
        console.error('[PersistentMapShell] Google Maps failed to load, switching to Leaflet fallback:', err);
        setLoadFailed(true);
        setFallback(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Handle container resizing (e.g., when switching from Create Cluster to Dashboard)
  useEffect(() => {
    if (!containerRef.current || !isMapReady) return;
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef?.current && window.google) {
        window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [isMapReady, mapInstanceRef]);

  // Sync external mapState center/zoom requests to the live instance
  useEffect(() => {
    // handled imperatively via panTo in MapContext — nothing needed here
  }, [mapState, isMapReady]);

  const handleFallbackClick = useCallback((coords) => {
    // bubble into mapState so pages can react if needed
    setMapState((prev) => ({ ...prev, lastClick: coords }));
  }, [setMapState]);

  const isVisible = mapMode !== 'hidden';

  return (
    <div
      className={`persistent-map-shell map-mode-${mapMode}`}
      style={{
        position: 'absolute',
        inset: 0,
        visibility: isVisible ? 'visible' : 'hidden',
        zIndex: isVisible ? 0 : -50,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {!useFallback && !loadFailed && (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      )}

      {(useFallback || loadFailed) && (
        <LeafletFallbackRouteMap
          center={mapState?.center || DEFAULT_CENTER}
          zoom={mapState?.zoom || 11}
          markers={mapState?.markers || []}
          routes={mapState?.routes || []}
          onMapClick={handleFallbackClick}
        />
      )}

      {!apiKey && !loadFailed && (
        <div className="map-loading-fallback">
          <span>Memuat Google Maps…</span>
        </div>
      )}
    </div>
  );
};

export default PersistentMapShell;
