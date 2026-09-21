import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveRoutesList } from './components/ActiveRoutesList';
import { useRouteFilter } from '../../hooks/useRouteFilter';
import { filterStopsForToday } from '../../utils/dateUtils';
import { useMap } from '../../context/MapContext';
import { useMapData } from '../../context/MapDataContext';
import { computeClusterPolygons } from '../../utils/clusterBoundaryHelper';
import '../../styles/pages/Dashboard.css';

export const DashboardPage = ({ searchQuery = '' }) => {
  const { user, activeRoutes = [], salesStops = [] } = useApp();
  const {
    setMapMode,
    setMarkers,
    clearMarkers,
    setPolylines,
    clearPolylines,
    setPolygons,
    clearPolygons,
    panTo,
    fitBounds,
    isMapReady,
  } = useMap();
  const { outlets = [], clusters: mapClusters = [] } = useMapData();

  const isSalesRole = user?.role === 'SALES';

  // Stops & rute difilter ke jadwal HARI INI
  const todayStops = useMemo(() => filterStopsForToday(salesStops), [salesStops]);

  const todayRoutes = useMemo(() => {
    return (activeRoutes || [])
      .map((route) => ({ ...route, stops: filterStopsForToday(route.stops || []) }))
      .filter((route) => route.stops.length > 0);
  }, [activeRoutes]);

  // ─── Sales name filter ──────────────────────────────────────────────────────
  const [selectedSalesName, setSelectedSalesName] = useState('ALL');

  const salesOptions = useMemo(() => {
    const names = new Set();
    todayRoutes.forEach((r) => {
      const n = r.repName || r.name;
      if (n) names.add(n);
    });
    return Array.from(names).sort();
  }, [todayRoutes]);

  const filteredRoutes = useMemo(() => {
    if (selectedSalesName === 'ALL') return todayRoutes;
    return todayRoutes.filter((r) => (r.repName || r.name) === selectedSalesName);
  }, [todayRoutes, selectedSalesName]);

  const { routes, setQuery } = useRouteFilter(filteredRoutes);

  // Selected Sales route (for SPV/Manager view or drilldown)
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Selected Outlet (for auto-focusing map panTo)
  const [selectedOutlet, setSelectedOutlet] = useState(null);

  // For Sales role, restrict strictly to their own assigned stops
  const displayStops = useMemo(() => {
    if (isSalesRole) {
      const myStops = todayStops.filter(
        (stop) => !stop.assignedSalesName || stop.assignedSalesName === user?.name
      );
      return myStops.length > 0 ? myStops : todayStops;
    }
    return todayStops;
  }, [todayStops, isSalesRole, user]);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery, setQuery]);

  // ─── Map Mode Setup & Teardown ──────────────────────────────────────────────
  useEffect(() => {
    setMapMode('dashboard');

    return () => {
      setMapMode('hidden');
      clearMarkers();
      clearPolylines();
      clearPolygons();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 1. Cluster Polygons (Wilayah Klaster Hari Ini) ─────────────────────────
  const clusterPolygons = useMemo(() => {
    return computeClusterPolygons(mapClusters, outlets);
  }, [mapClusters, outlets]);

  useEffect(() => {
    if (!isMapReady || clusterPolygons.length === 0) return;

    // Highlight cluster if selected route or filtered sales belongs to it
    const activeClusterName = selectedRoute?.clusterName;

    const styledPolygons = clusterPolygons.map((poly) => {
      const isHighlighted = activeClusterName && poly.name.toLowerCase() === activeClusterName.toLowerCase();
      return {
        ...poly,
        strokeOpacity: isHighlighted ? 1.0 : 0.7,
        strokeWeight: isHighlighted ? 3 : 2,
        fillOpacity: isHighlighted ? 0.28 : 0.12,
      };
    });

    setPolygons(styledPolygons);
  }, [isMapReady, clusterPolygons, selectedRoute, setPolygons]);

  // ─── 2. Outlet Markers ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMapReady || outlets.length === 0) return;

    let visibleOutlets = outlets;

    if (selectedRoute && Array.isArray(selectedRoute.stops) && selectedRoute.stops.length > 0) {
      const routeOutletCodes = new Set(
        selectedRoute.stops.map((s) => s.outletCode || s.customerId).filter(Boolean)
      );
      const routeOutletIds = new Set(selectedRoute.stops.map((s) => s.id).filter(Boolean));

      visibleOutlets = outlets.map((o) => ({
        ...o,
        _highlighted: routeOutletCodes.has(o.outletCode) || routeOutletIds.has(o.id),
      }));
    } else if (selectedSalesName !== 'ALL') {
      const currentSalesRoutes = todayRoutes.filter(
        (r) => (r.repName || r.name) === selectedSalesName
      );
      const allowedCodes = new Set();
      currentSalesRoutes.forEach((r) =>
        r.stops.forEach((s) => {
          if (s.outletCode) allowedCodes.add(s.outletCode);
        })
      );
      visibleOutlets = outlets.map((o) => ({
        ...o,
        _highlighted: allowedCodes.has(o.outletCode),
      }));
    }

    const getSvgMarker = (color, scale = 1, label = '') => {
      const size = Math.round(30 * scale);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}"><path fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    };

    // Find cluster color for an outlet
    const getOutletColor = (outlet) => {
      const cluster = mapClusters.find((c) => c.id === outlet.clusterId);
      if (cluster?.colorHex) return cluster.colorHex;
      return outlet.type === 'GENERAL_TRADE' ? '#3b82f6' : '#8b5cf6';
    };

    const markersData = visibleOutlets
      .filter((o) => o.latitude && o.longitude)
      .map((o) => {
        const highlighted = o._highlighted;
        const baseColor = getOutletColor(o);

        return {
          id: o.id,
          lat: Number(o.latitude),
          lng: Number(o.longitude),
          title: o.name,
          icon: {
            url: getSvgMarker(highlighted ? '#ea580c' : baseColor, highlighted ? 1.35 : 0.95),
            anchor: window.google ? new window.google.maps.Point(15, 30) : { x: 15, y: 30 },
          },
          zIndex: highlighted ? 50 : 1,
        };
      });

    setMarkers(markersData);
  }, [isMapReady, outlets, selectedRoute, selectedSalesName, todayRoutes, mapClusters, setMarkers]);

  // ─── 3. Selected Route Polyline (Jalur Rute) ────────────────────────────────
  useEffect(() => {
    if (!isMapReady) return;

    if (selectedRoute && Array.isArray(selectedRoute.stops) && selectedRoute.stops.length > 0) {
      const pathPoints = selectedRoute.stops
        .filter((s) => s.latitude && s.longitude)
        .map((s) => ({ lat: Number(s.latitude), lng: Number(s.longitude) }));

      if (pathPoints.length > 0) {
        setPolylines([
          {
            id: `route-polyline-${selectedRoute.id}`,
            path: pathPoints,
            color: '#2563eb',
            strokeWeight: 4,
            strokeOpacity: 0.95,
            isActive: true,
          },
        ]);

        if (pathPoints.length > 1) {
          fitBounds(pathPoints);
        } else {
          panTo(pathPoints[0].lat, pathPoints[0].lng, 15);
        }
      }
    } else {
      clearPolylines();
    }
  }, [isMapReady, selectedRoute, setPolylines, clearPolylines, fitBounds, panTo]);

  // ─── 4. Auto-Focus ke Outlet yang dipilih ───────────────────────────────────
  useEffect(() => {
    if (selectedOutlet) {
      const lat = Number(selectedOutlet.latitude || selectedOutlet.lat);
      const lng = Number(selectedOutlet.longitude || selectedOutlet.lng);
      if (lat && lng) {
        panTo(lat, lng, 16);
      }
    }
  }, [selectedOutlet, panTo]);

  return (
    <div className="dashboard-wrapper">
      {/* Floating Dashboard Left Overlay Panel */}
      <div className="dashboard-overlay">
        <div className="dashboard-left-col">
          <ActiveRoutesList
            routes={routes}
            salesStops={displayStops}
            selectedRoute={selectedRoute}
            onSelectRoute={(route) => {
              setSelectedRoute((prev) => (prev?.id === route.id ? null : route));
              setSelectedOutlet(null);
            }}
            selectedOutlet={selectedOutlet}
            onSelectOutlet={setSelectedOutlet}
            userRole={user?.role || 'SALES'}
            selectedSalesName={selectedSalesName}
            onSelectSalesName={(name) => {
              setSelectedSalesName(name);
              setSelectedRoute(null);
              setSelectedOutlet(null);
            }}
            salesOptions={salesOptions}
          />
        </div>
      </div>
    </div>
  );
};
