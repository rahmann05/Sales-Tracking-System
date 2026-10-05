import React, { useEffect, useRef } from 'react';
import { useMapData } from '../../../context/MapDataContext';
import { useMap } from '../../../context/MapContext';
import { LeafletFallbackRouteMap } from '../../Dashboard/components/LeafletFallbackRouteMap';

export const RouteMapView = () => {
  const { outlets = [], clusters = [] } = useMapData();
  const { isMapReady, useFallback } = useMap();
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const elementsRef = useRef({ markers: [], polylines: [] });

  useEffect(() => {
    if (!window.google?.maps || !mapRef.current || useFallback) return;

    if (!instanceRef.current) {
      instanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: -6.89, lng: 107.54 }, // Bandung/Cimahi center
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
      });
    }

    const map = instanceRef.current;

    // Clean up previous elements
    elementsRef.current.markers.forEach((m) => m.setMap(null));
    elementsRef.current.polylines.forEach((p) => p.setMap(null));
    elementsRef.current.markers = [];
    elementsRef.current.polylines = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    const getSvgMarker = (color) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    };

    // 1. Draw Outlets
    if (outlets && outlets.length > 0) {
      outlets.forEach((o) => {
        if (o.latitude == null || o.longitude == null) return;
        let markerColor = '#6b7280';
        if (o.type === 'GENERAL_TRADE') {
          markerColor = o.clusterId ? '#1e3a8a' : '#3b82f6';
        } else {
          markerColor = o.clusterId ? '#581c87' : '#a855f7';
        }

        const marker = new window.google.maps.Marker({
          position: { lat: Number(o.latitude), lng: Number(o.longitude) },
          map,
          title: o.name,
          icon: {
            url: getSvgMarker(markerColor),
            anchor: new window.google.maps.Point(16, 32),
          },
        });
        elementsRef.current.markers.push(marker);
        bounds.extend({ lat: Number(o.latitude), lng: Number(o.longitude) });
        hasPoints = true;
      });
    }

    // 2. Draw Cluster Polylines
    if (clusters && clusters.length > 0) {
      clusters.forEach((cluster) => {
        const activeRoute = cluster.routes?.find((r) => r.isActive);
        if (activeRoute && activeRoute.overviewPath && Array.isArray(activeRoute.overviewPath)) {
          const polyline = new window.google.maps.Polyline({
            path: activeRoute.overviewPath,
            map,
            strokeColor: cluster.color || '#3b82f6',
            strokeWeight: 4,
            strokeOpacity: 0.8,
          });
          elementsRef.current.polylines.push(polyline);
        }
      });
    }

    if (hasPoints) {
      map.fitBounds(bounds);
    }

    // Cleanup on unmount
    return () => {
      elementsRef.current.markers.forEach((m) => m.setMap(null));
      elementsRef.current.polylines.forEach((p) => p.setMap(null));
      elementsRef.current.markers = [];
      elementsRef.current.polylines = [];
    };
  }, [outlets, clusters, isMapReady, useFallback]);

  // If in fallback mode or Google Maps unavailable
  if (useFallback || (!isMapReady && !window.google?.maps)) {
    const fallbackMarkers = (outlets || [])
      .filter((o) => o.latitude != null && o.longitude != null)
      .map((o) => ({
        id: o.id,
        lat: o.latitude,
        lng: o.longitude,
        title: o.name,
        color: o.type === 'GENERAL_TRADE' ? '#3b82f6' : '#a855f7',
      }));

    const fallbackRoutes = (clusters || [])
      .map((c) => {
        const activeRoute = c.routes?.find((r) => r.isActive);
        if (!activeRoute?.overviewPath) return null;
        return {
          id: c.id,
          path: activeRoute.overviewPath,
          color: c.color || '#3b82f6',
          strokeWeight: 4,
        };
      })
      .filter(Boolean);

    return (
      <div className="w-full h-full relative bg-surface-variant/30 min-h-[400px]">
        <LeafletFallbackRouteMap
          center={{ lat: -6.89, lng: 107.54 }}
          zoom={12}
          markers={fallbackMarkers}
          routes={fallbackRoutes}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-surface-variant/30">
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />
    </div>
  );
};
