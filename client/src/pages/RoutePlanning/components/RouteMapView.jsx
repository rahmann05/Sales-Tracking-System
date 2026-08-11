import React, { useEffect } from 'react';
import { useMap } from '../../../context/MapContext';
import { useMapData } from '../../../context/MapDataContext';
import { useApp } from '../../../context/AppContext';

export const RouteMapView = () => {
  const { setMapMode, setMarkers, clearMarkers, clearPolylines } = useMap();
  const { outlets, clusters } = useMapData();

  const { user, activeRoutes = [] } = useApp();

  useEffect(() => {
    setMapMode('route-map');

    // Tampilkan outlet dan polyline rute cluster
    if (outlets && outlets.length > 0) {
      // Semua outlet untuk ADMIN/OPS, filter untuk SPV/SALES
      let visibleOutlets = outlets;
      
      const markersData = visibleOutlets.map(o => ({
        id: o.id,
        lat: o.latitude,
        lng: o.longitude,
        title: o.name,
        icon: o.clusterId ? 'http://maps.google.com/mapfiles/ms/icons/red-pushpin.png' : 'http://maps.google.com/mapfiles/ms/icons/gray-pushpin.png'
      }));
      setMarkers(markersData);
    }

    // Set Polylines for existing clusters
    if (clusters && clusters.length > 0) {
      const polylines = [];
      clusters.forEach((cluster) => {
        const activeRoute = cluster.routes?.find(r => r.isActive);
        if (activeRoute && activeRoute.overviewPath && Array.isArray(activeRoute.overviewPath)) {
          polylines.push({
            id: `cluster-${cluster.id}`,
            path: activeRoute.overviewPath,
            color: cluster.color || '#3b82f6',
            strokeWeight: 4,
            strokeOpacity: 0.8,
          });
        }
      });
      if (polylines.length > 0) {
        setPolylines(polylines);
      }
    }

    return () => {
      setMapMode('hidden');
      clearMarkers();
      clearPolylines();
    };
  }, [outlets, clusters, setMapMode, setMarkers, clearMarkers, setPolylines, clearPolylines]);

  return (
    <div className="w-full h-full">
      {/* PersistentMapShell handles the actual map rendering. 
          This component just dictates the state and acts as an overlay or spacer if needed. */}
    </div>
  );
};
