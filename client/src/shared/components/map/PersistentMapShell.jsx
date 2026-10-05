import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from '../../../context/MapContext';
import { configApi } from '../../../services/api';
import { LeafletFallbackRouteMap } from '../../../pages/Dashboard/components/LeafletFallbackRouteMap';
import '../../../styles/components/PersistentMapShell.css';

const DEFAULT_CENTER = { lat: -6.88498411526505, lng: 107.48995363176957 };

const DEFAULT_API_KEY = 'AIzaSyAI-dw2SlLfX135yj4sNVNt9LIgORJB4dA';
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async&callback=__initGoogleMapsCallback`;
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

  const [apiKey, setApiKey] = useState(() => {
    const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (envKey && envKey.startsWith('AIzaSyAI')) return envKey;
    return DEFAULT_API_KEY;
  });
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

  // Fetch API key dynamically from system config, updating if configured
  useEffect(() => {
    let mounted = true;
    configApi
      .getByKey('MAPS_API_KEY')
      .then((res) => {
        const val = typeof res?.data === 'string' ? res.data : (res?.data?.value || res?.data);
        if (mounted && val && typeof val === 'string' && val.startsWith('AIza') && val !== apiKey) {
          setApiKey(val);
        }
      })
      .catch(() => {
        // Silently keep default apiKey
      });
    return () => { mounted = false; };
  }, [apiKey]);

  // Initialize map once
  useEffect(() => {
    if (!apiKey || initRef.current || !containerRef.current) return;
    initRef.current = true;

    const initMapAsync = async () => {
      try {
        await loadGoogleMapsScript(apiKey);
        if (!containerRef.current) return;
        const map = new window.google.maps.Map(containerRef.current, {
          center: mapState?.center || DEFAULT_CENTER,
          zoom: mapState?.zoom || 11,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        });
        setMapInstance(map);
      } catch (err) {
        console.warn('[PersistentMapShell] Google Maps not accessible, activating Leaflet fallback:', err.message || err);
        setLoadFailed(true);
        setFallback(true);
      }
    };
    initMapAsync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

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
