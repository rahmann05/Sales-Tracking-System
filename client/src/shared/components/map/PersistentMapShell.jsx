import {useFeaturePolicy} from '../../hooks/useFeaturePolicy';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from '../../../context/MapContext';
import { useApp } from '../../../context/AppContext';
import { LeafletFallbackRouteMap } from '../../../pages/Dashboard/components/LeafletFallbackRouteMap';
import '../../../styles/components/PersistentMapShell.css';

const DEFAULT_CENTER = { lat: -6.88498411526505, lng: 107.48995363176957 };

const SCRIPT_TIMEOUT_MS = 6000;

/**
 * Load the Google Maps JS API exactly once with resilient timeout and error handling.
 */
const loadGoogleMapsScript = (apiKey) =>
  new Promise((resolve, reject) => {
    if (window.google?.maps?.Map) return resolve(window.google.maps);

    let isSettled = false;
    const timeoutId = setTimeout(() => {
      if (isSettled) return;
      isSettled = true;
      console.warn(`[PersistentMapShell] Google Maps script load timed out after ${SCRIPT_TIMEOUT_MS}ms. Triggering fallback.`);
      reject(new Error('Google Maps script load timed out'));
    }, SCRIPT_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeoutId);
      delete window.__initGoogleMapsCallback;
    };

    window.__initGoogleMapsCallback = () => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      resolve(window.google.maps);
    };

    const existing = document.getElementById('google-maps-script');
    if (existing) {
      if (existing.src.includes(`key=${apiKey}`)) {
        if (window.google?.maps?.Map) {
          cleanup();
          return resolve(window.google.maps);
        }
        const prevCallback = window.__initGoogleMapsCallback;
        window.__initGoogleMapsCallback = () => {
          if (prevCallback) prevCallback();
          if (isSettled) return;
          isSettled = true;
          cleanup();
          resolve(window.google.maps);
        };
        existing.addEventListener('error', (e) => {
          if (isSettled) return;
          isSettled = true;
          cleanup();
          reject(e);
        });
        return;
      } else {
        // Stale or invalid key on existing script tag — remove and reload
        existing.remove();
        delete window.google;
      }
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&loading=async&callback=__initGoogleMapsCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = (e) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      reject(e);
    };
    document.head.appendChild(script);
  });

/**
 * PersistentMapShell
 * Renders the ONE persistent map engine for the entire app lifetime.
 * Automatically switches between Google Maps and OpenStreetMap Leaflet
 * without any UI interruptions or white screens.
 */
export const PersistentMapShell = () => {
 const mapPolicy=useFeaturePolicy('MAPS');
  const {settings} = useApp();
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

  const apiKey = settings.MAPS_BROWSER_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [loadFailed, setLoadFailed] = useState(false);

  // Global gm_authFailure handler: Google Maps Platform callback when API auth fails
  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn('[PersistentMapShell] Google Maps authentication failed (gm_authFailure). Automatically switching to Leaflet fallback.');
      setLoadFailed(true);
      setFallback(true);
    };
    return () => {
      delete window.gm_authFailure;
    };
  }, [setFallback]);

  useEffect(() => {
    if (!apiKey) setFallback(true);
    else if (!initRef.current && !loadFailed) setFallback(false);
  },[apiKey,loadFailed,setFallback]);

  useEffect(()=>{if(!mapPolicy.canStart){initRef.current=false;setMapInstance(null);}},[mapPolicy.canStart,setMapInstance]);

  // Initialize map once
  useEffect(() => {
    if (!mapPolicy.canStart || mapMode==='hidden' || !apiKey || initRef.current || !containerRef.current) return;
    initRef.current = true;
    let cancelled=false;

    const initMapAsync = async () => {
      try {
        await loadGoogleMapsScript(apiKey);
        if(cancelled)return;
        if(!window.google.maps.marker?.AdvancedMarkerElement)await window.google.maps.importLibrary('marker');
        if (cancelled||!containerRef.current) return;
        const map = new window.google.maps.Map(containerRef.current, {
          mapId: settings.MAPS_MAP_ID || 'DEMO_MAP_ID',
          center: mapState?.center || DEFAULT_CENTER,
          zoom: mapState?.zoom || 11,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        });
        setMapInstance(map);
      } catch (err) {
        if(cancelled)return;
        console.warn('[PersistentMapShell] Google Maps not accessible, activating Leaflet fallback:', err.message || err);
        setLoadFailed(true);
        setFallback(true);
      }
    };
    initMapAsync();
    return()=>{cancelled=true;if(!mapInstanceRef.current)initRef.current=false;};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey,mapMode,mapPolicy.canStart]);

  // Handle container resizing
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

  const handleFallbackClick = useCallback((coords) => {
    setMapState((prev) => ({ ...prev, lastClick: coords }));
  }, [setMapState]);

  const isVisible = mapMode !== 'hidden';

  if(!mapPolicy.canStart)return isVisible?<div className="app-notice" role="status">{mapPolicy.reason}</div>:null;
  return (
    <div
      className={`persistent-map-shell map-mode-${mapMode}`}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: isVisible ? 0 : -50,
        visibility: isVisible ? 'visible' : 'hidden',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {!useFallback && !loadFailed && (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      )}

      {(useFallback || loadFailed) && isVisible && (
        <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <LeafletFallbackRouteMap
            center={mapState?.center || DEFAULT_CENTER}
            zoom={mapState?.zoom || 11}
            markers={mapState?.markers || []}
            routes={mapState?.routes || []}
            onMapClick={handleFallbackClick}
          />
        </div>
      )}

      {!apiKey && !loadFailed && (
        <div className="map-loading-fallback">
          <span>Memuat Peta…</span>
        </div>
      )}
    </div>
  );
};

export default PersistentMapShell;
