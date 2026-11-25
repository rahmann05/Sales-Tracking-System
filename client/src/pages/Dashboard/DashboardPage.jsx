import { useWorkspaceState } from '../../shared/hooks/useWorkspaceState';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveRoutesList } from './components/ActiveRoutesList';
import { ClusterMapLegend } from './components/ClusterMapLegend';
import { RouteProviderBadge } from './components/RouteProviderBadge';
import { filterStopsForToday } from '../../utils/dateUtils';
import { useMap } from '../../context/MapContext';
import { useMapData } from '../../context/MapDataContext';
import { computeClusterPolygons } from '../../utils/clusterBoundaryHelper';
import { googlePlacesService } from '../../services/googlePlacesService';
import { googleDirectionsService } from '../../services/googleDirectionsService';
import {
  resolveClusterColor,
  buildClusterSequenceMap,
  resolveRouteClusters,
  filterOperationalMapScope,
  buildPjpStopLookup,
  buildNumberedPinSvg,
} from './dashboardMapHelpers';
import '../../styles/pages/Dashboard.css';

export const DashboardPage = () => {
  const { user, settings, activeRoutes = [], salesStops = [] } = useApp();
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
  const {
    outlets = [],
    clusters: mapClusters = [],
    error: mapDataError,
    refetchAll,
  } = useMapData();

  const outletsRef = useRef(outlets);
  outletsRef.current = outlets;

  const [clusterLayer, setClusterLayer] = useWorkspaceState(
    'mapClusters',
    settings.MAP_DEFAULT_SHOW_CLUSTERS === false ? 'OFF' : 'ON'
  );
  const [outletLayer, setOutletLayer] = useWorkspaceState(
    'mapOutlets',
    settings.MAP_DEFAULT_SHOW_OUTLETS === false ? 'OFF' : 'ON'
  );
  const isSalesRole = user?.role === 'SALES';

  const todayStops = useMemo(() => filterStopsForToday(salesStops), [salesStops]);

  const todayRoutes = useMemo(() => {
    return (activeRoutes || [])
      .map((route) => ({ ...route, stops: filterStopsForToday(route.stops || []) }))
      .filter((route) => route.stops.length > 0);
  }, [activeRoutes]);

  const [selectedSalesName, setSelectedSalesName] = useState('ALL');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [routeStatus, setRouteStatus] = useState(null);

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

  const displayStops = useMemo(() => {
    if (isSalesRole) {
      const myStops = todayStops.filter(
        (stop) => !stop.assignedSalesName || stop.assignedSalesName === user?.name
      );
      return myStops.length > 0 ? myStops : todayStops;
    }
    return todayStops;
  }, [todayStops, isSalesRole, user]);

  // O(1) lookup maps for clusters, sequence numbers from DB, and route colors
  const clusterById = useMemo(
    () => new Map(mapClusters.map((c) => [c.id, c])),
    [mapClusters]
  );

  const clusterSequenceMap = useMemo(
    () => buildClusterSequenceMap(mapClusters),
    [mapClusters]
  );

  const clusterColorByRouteId = useMemo(() => {
    const map = {};
    todayRoutes.forEach((route, idx) => {
      const matched = resolveRouteClusters(route, mapClusters);
      map[route.id] = resolveClusterColor(matched[0], idx);
    });
    return map;
  }, [todayRoutes, mapClusters]);

  // Scope visible clusters & outlets to active salesman / route filter
  const { isFiltered, visibleClusters, visibleOutlets, focusRoutes } = useMemo(
    () =>
      filterOperationalMapScope({
        outlets,
        clusters: mapClusters,
        routes: todayRoutes,
        selectedSalesName,
        selectedRoute,
      }),
    [outlets, mapClusters, todayRoutes, selectedSalesName, selectedRoute]
  );

  const pjpLookup = useMemo(
    () => buildPjpStopLookup(isFiltered ? (selectedRoute ? [selectedRoute] : focusRoutes) : todayRoutes),
    [isFiltered, selectedRoute, focusRoutes, todayRoutes]
  );

  const legendData = useMemo(() => {
    const visibleIds = new Set(visibleClusters.map((c) => c.id));
    const countByCluster = new Map();
    visibleOutlets.forEach((o) => {
      if (o.clusterId) {
        countByCluster.set(o.clusterId, (countByCluster.get(o.clusterId) || 0) + 1);
      }
    });

    const clusters = visibleClusters.map((c, idx) => ({
      id: c.id,
      name: c.name,
      color: resolveClusterColor(c, idx),
      salesName: c.assignedSales?.name || '',
      outletCount: countByCluster.get(c.id) ?? (visibleIds.has(c.id) ? 0 : null),
    }));

    const hasClusterSequence = visibleOutlets.some(
      (o) =>
        !pjpLookup.byOutletId.has(o.id) &&
        !(o.outletCode && pjpLookup.byOutletCode.has(o.outletCode)) &&
        clusterSequenceMap.has(o.id)
    );

    return {
      clusters,
      totalOutletsCount: visibleOutlets.length,
      hasClusterSequence,
    };
  }, [visibleClusters, visibleOutlets, pjpLookup, clusterSequenceMap]);

  const handleSelectOutlet = useCallback((stopOrOutlet) => {
    if (!stopOrOutlet) return;
    setSelectedOutlet(stopOrOutlet);
    googlePlacesService.openInGoogleMaps(stopOrOutlet, outletsRef.current);
  }, []);

  // Setup & Teardown Map Mode
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

  // 1. Cluster Polygons (scoped to active filter)
  const clusterPolygons = useMemo(
    () => computeClusterPolygons(visibleClusters, visibleOutlets),
    [visibleClusters, visibleOutlets]
  );

  useEffect(() => {
    if (!isMapReady) return;
    if (clusterLayer === 'OFF' || clusterPolygons.length === 0) {
      clearPolygons();
      return;
    }

    const styledPolygons = clusterPolygons.map((poly) => ({
      ...poly,
      strokeOpacity: isFiltered ? 0.95 : 0.72,
      strokeWeight: isFiltered ? 2.5 : 2,
      fillOpacity: isFiltered ? 0.22 : 0.12,
    }));
    setPolygons(styledPolygons);
  }, [isMapReady, clusterPolygons, isFiltered, setPolygons, clusterLayer, clearPolygons]);

  const selectedOutletId = selectedOutlet?.id || null;
  const selectedOutletCode = selectedOutlet?.outletCode || selectedOutlet?.customerId || null;
  const selectedRefOutletId = selectedOutlet?.outletId || null;

  // 2. Scoped & Numbered Outlet Markers
  useEffect(() => {
    if (!isMapReady) return;
    if (outletLayer === 'OFF' || visibleOutlets.length === 0) {
      clearMarkers();
      return;
    }

    const hasWindowGoogle = typeof window !== 'undefined' && Boolean(window.google?.maps);

    const markersData = visibleOutlets
      .filter((o) => Number.isFinite(Number(o.latitude)) && Number.isFinite(Number(o.longitude)))
      .map((o) => {
        const cluster = clusterById.get(o.clusterId);
        const baseColor = resolveClusterColor(cluster);
        const pjpEntry =
          pjpLookup.byOutletId.get(o.id) ||
          (o.outletCode ? pjpLookup.byOutletCode.get(o.outletCode) : null);
        const isPjp = Boolean(pjpEntry);
        const clusterSeq = clusterSequenceMap.get(o.id)?.sequence ?? null;
        const number = isPjp ? pjpEntry.sequence : clusterSeq;
        const isSelectedOutlet = Boolean(
          (selectedOutletId && (selectedOutletId === o.id || selectedRefOutletId === o.id)) ||
            (selectedOutletCode && o.outletCode === selectedOutletCode)
        );

        const scale = isSelectedOutlet
          ? 1.25
          : isPjp
            ? 1.05
            : isFiltered
              ? 0.95
              : 0.85;

        const svgIcon = buildNumberedPinSvg({
          color: baseColor,
          number,
          scale,
          variant: isPjp ? 'pjp' : 'cluster',
          status: pjpEntry?.stop?.status || null,
          isSelected: isSelectedOutlet,
        });

        const scaledSize = hasWindowGoogle
          ? new window.google.maps.Size(svgIcon.scaledSize.width, svgIcon.scaledSize.height)
          : svgIcon.scaledSize;
        const anchor = hasWindowGoogle
          ? new window.google.maps.Point(svgIcon.anchor.x, svgIcon.anchor.y)
          : svgIcon.anchor;

        const prefix = number != null ? `#${number} · ` : '';
        const suffix = isPjp
          ? ` (${pjpEntry.stop?.status || 'PENDING'})`
          : cluster?.name
            ? ` · ${cluster.name}`
            : '';

        return {
          id: o.id,
          googleMapsOnly: Boolean(o.googleMapsOnly),
          lat: Number(o.latitude),
          lng: Number(o.longitude),
          title: `${prefix}${o.name}${suffix}`,
          color: baseColor,
          sequenceLabel: number != null ? String(number) : undefined,
          _highlighted: isPjp || isSelectedOutlet,
          icon: {
            url: svgIcon.url,
            scaledSize,
            anchor,
          },
          zIndex: isSelectedOutlet ? 200 : isPjp ? 100 : 10,
          onClick: () => handleSelectOutlet(pjpEntry?.stop || o),
        };
      });

    setMarkers(markersData);
  }, [
    isMapReady,
    visibleOutlets,
    clusterById,
    pjpLookup,
    clusterSequenceMap,
    selectedOutletId,
    selectedRefOutletId,
    selectedOutletCode,
    isFiltered,
    outletLayer,
    setMarkers,
    clearMarkers,
    handleSelectOutlet,
  ]);

  // 3. Road-Following Route Polyline (Google Directions -> OSRM -> Straight-line Fallback)
  useEffect(() => {
    if (!isMapReady) return;
    if (!selectedRoute || !Array.isArray(selectedRoute.stops) || selectedRoute.stops.length === 0) {
      clearPolylines();
      setRouteStatus(null);
      return;
    }

    const orderedStops = [...selectedRoute.stops].sort(
      (a, b) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0)
    );
    const waypoints = orderedStops
      .filter((s) => Number.isFinite(Number(s.latitude)) && Number.isFinite(Number(s.longitude)))
      .map((s) => ({
        lat: Number(s.latitude),
        lng: Number(s.longitude),
        outletId: s.outletId || s.outlet?.id,
        googleMapsOnly: Boolean(s.googleMapsOnly),
      }));

    if (waypoints.length === 0) {
      clearPolylines();
      setRouteStatus(null);
      return;
    }
    if (waypoints.length === 1) {
      clearPolylines();
      setRouteStatus(null);
      panTo(waypoints[0].lat, waypoints[0].lng, 15);
      return;
    }

    let cancelled = false;
    const routeColor = clusterColorByRouteId[selectedRoute.id] || '#2563eb';
    fitBounds(waypoints);
    setRouteStatus({ loading: true, provider: 'LOADING', isFallback: false, reason: null });

    googleDirectionsService.resolveRoadRouteWithMeta(waypoints).then((res) => {
      if (cancelled) return;
      const gMapsOnly = waypoints.some((w) => w.googleMapsOnly);
      if (res.isFallback) {
        setPolylines([
          {
            id: `route-polyline-${selectedRoute.id}`,
            googleMapsOnly: gMapsOnly,
            path: res.path,
            color: routeColor,
            strokeWeight: 4,
            strokeOpacity: 0.9,
            isDashed: true,
            zIndex: 10,
            isActive: true,
          },
        ]);
      } else {
        setPolylines([
          {
            id: `route-halo-${selectedRoute.id}`,
            googleMapsOnly: gMapsOnly,
            path: res.path,
            color: '#ffffff',
            strokeWeight: 7,
            strokeOpacity: 0.85,
            zIndex: 9,
            isActive: false,
          },
          {
            id: `route-polyline-${selectedRoute.id}`,
            googleMapsOnly: gMapsOnly,
            path: res.path,
            color: routeColor,
            strokeWeight: 4.5,
            strokeOpacity: 0.95,
            zIndex: 10,
            isActive: true,
          },
        ]);
      }
      setRouteStatus({
        loading: false,
        provider: res.provider,
        isFallback: res.isFallback,
        reason: res.reason,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isMapReady, selectedRoute, clusterColorByRouteId, setPolylines, clearPolylines, fitBounds, panTo]);

  // 4. Auto-fit bounds when filtering by sales without an active route
  const scopeSignature = `${selectedSalesName}:${selectedRoute?.id || ''}:${visibleOutlets.length}`;
  const visibleOutletsRef = useRef(visibleOutlets);
  visibleOutletsRef.current = visibleOutlets;

  useEffect(() => {
    if (!isMapReady || selectedRoute || selectedOutletId) return;
    const pts = visibleOutletsRef.current
      .filter((o) => Number.isFinite(Number(o.latitude)) && Number.isFinite(Number(o.longitude)))
      .map((o) => ({ lat: Number(o.latitude), lng: Number(o.longitude) }));
    if (pts.length > 1) fitBounds(pts);
    else if (pts.length === 1) panTo(pts[0].lat, pts[0].lng, 15);
  }, [isMapReady, scopeSignature, selectedRoute, selectedOutletId, fitBounds, panTo]);

  // 5. Auto-Focus ke Outlet yang dipilih
  useEffect(() => {
    if (selectedOutlet) {
      const lat = Number(selectedOutlet.latitude || selectedOutlet.lat);
      const lng = Number(selectedOutlet.longitude || selectedOutlet.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        panTo(lat, lng, 16);
      }
    }
  }, [selectedOutlet, panTo]);

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-overlay">
        <div className="dashboard-left-col">
          {mapDataError ? (
            <div role="alert" className="app-error pointer-events-auto">
              <p>Data peta belum berhasil diperbarui: {mapDataError}</p>
              <button type="button" className="app-button" onClick={refetchAll}>
                Coba lagi
              </button>
            </div>
          ) : null}
          <div className="app-actions" aria-label="Lapisan peta">
            <label>
              <input
                type="checkbox"
                checked={clusterLayer !== 'OFF'}
                onChange={(e) => setClusterLayer(e.target.checked ? 'ON' : 'OFF')}
              />{' '}
              Wilayah cluster
            </label>
            <label>
              <input
                type="checkbox"
                checked={outletLayer !== 'OFF'}
                onChange={(e) => setOutletLayer(e.target.checked ? 'ON' : 'OFF')}
              />{' '}
              Titik outlet
            </label>
          </div>
          <ActiveRoutesList
            routes={filteredRoutes}
            salesStops={displayStops}
            selectedRoute={selectedRoute}
            onSelectRoute={(route) => {
              setSelectedRoute((prev) => (prev?.id === route.id ? null : route));
              setSelectedOutlet(null);
            }}
            selectedOutlet={selectedOutlet}
            onSelectOutlet={handleSelectOutlet}
            userRole={user?.role || 'SALES'}
            selectedSalesName={selectedSalesName}
            onSelectSalesName={(name) => {
              setSelectedSalesName(name);
              setSelectedOutlet(null);
              if (name === 'ALL') {
                setSelectedRoute(null);
              } else {
                const matching = todayRoutes.filter((r) => (r.repName || r.name) === name);
                setSelectedRoute(matching.length === 1 ? matching[0] : null);
              }
            }}
            salesOptions={salesOptions}
            clusterColorByRouteId={clusterColorByRouteId}
            routeStatus={routeStatus}
          />
        </div>

        <div className="dashboard-right-col">
          <div className="dashboard-map-hud">
            {routeStatus ? (
              <RouteProviderBadge
                provider={routeStatus.provider}
                reason={routeStatus.reason}
                inline
              />
            ) : null}
            <ClusterMapLegend
              clusters={legendData.clusters}
              totalOutletsCount={legendData.totalOutletsCount}
              isFiltered={isFiltered}
              activeSalesName={
                selectedRoute?.repName || (selectedSalesName !== 'ALL' ? selectedSalesName : '')
              }
              hasActiveRoute={Boolean(selectedRoute)}
              isFallbackRoute={Boolean(routeStatus?.isFallback)}
              hasClusterSequence={legendData.hasClusterSequence}
              inline
            />
          </div>
        </div>
      </div>
    </div>
  );
};
