import { useEffect, useMemo } from 'react';
import { useMap } from '../../../context/MapContext';
import { routingService } from '../../../services/routingService';
import { computeClusterPolygons } from '../../../utils/clusterBoundaryHelper';
import { getClusterColorHex } from '../../../services/clusterColorService';

export const UNASSIGNED_CLUSTER_NAME = 'Belum Ditugaskan';

const coordinates = (outlet) => ({
  lat: Number(outlet.latitude),
  lng: Number(outlet.longitude),
  googleMapsOnly: outlet.googleMapsOnly,
  outletId: outlet.id,
});
export function useClusterMap({
  step,
  allOutlets,
  areaOutlets,
  clusters = [],
  hideClustered = false,
  selectedOutlets,
  centerPoint,
  routes,
  activeRouteIndex,
  draft,
  selectCenter,
  toggleOutlet,
  busy,
  saving,
}) {
  const {
    setMapMode,
    setMarkers,
    clearMarkers,
    setPolylines,
    clearPolylines,
    addClickListener,
    removeClickListener,
    setPolygons,
    clearPolygons,
    isMapReady,
    panTo,
  } = useMap();
  // Existing territories (not the unassigned placeholder) and the color each one is drawn with.
  const territories = useMemo(
    () => clusters.filter((c) => c.name !== UNASSIGNED_CLUSTER_NAME),
    [clusters]
  );
  const colorByCluster = useMemo(
    () =>
      new Map(territories.map((c) => [c.id, c.colorHex || getClusterColorHex(c.name, '', null)])),
    [territories]
  );
  useEffect(() => {
    setMapMode('create-cluster');
    return () => {
      setMapMode('hidden');
      clearMarkers();
      clearPolylines();
      clearPolygons();
      removeClickListener();
    };
  }, [setMapMode, clearMarkers, clearPolylines, clearPolygons, removeClickListener]);
  // Area of every existing cluster, in that cluster's own color.
  useEffect(() => {
    if (!isMapReady) return;
    const withOutlets = (areaOutlets || allOutlets).filter((o) => colorByCluster.has(o.clusterId));
    setPolygons(
      computeClusterPolygons(territories, withOutlets).map((poly) => ({
        ...poly,
        color: colorByCluster.get(poly.id) || poly.color,
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillOpacity: 0.1,
      }))
    );
  }, [isMapReady, areaOutlets, allOutlets, territories, colorByCluster, setPolygons]);
  useEffect(() => {
    if (step === 2 && isMapReady && !busy && !saving) addClickListener(selectCenter);
    else removeClickListener();
    return removeClickListener;
  }, [step, isMapReady, busy, saving, selectCenter, addClickListener, removeClickListener]);
  useEffect(() => {
    if (centerPoint && isMapReady) panTo(centerPoint.lat, centerPoint.lng);
  }, [centerPoint, isMapReady, panTo]);
  useEffect(() => {
    if (!isMapReady) return;
    const order =
      routes[activeRouteIndex]?.outletOrder ||
      selectedOutlets.map((outlet, index) => ({ id: outlet.id, sequence: index + 1 }));
    const selected = new Map(order.map((item) => [item.id, item.sequence]));
    const outlets = new Map(
      [...allOutlets, ...selectedOutlets].map((outlet) => [outlet.id, outlet])
    );
    const markers = [...outlets.values()]
      .filter((outlet) => outlet.latitude != null && outlet.longitude != null)
      // Optional: hide points that already belong to a cluster (selected ones always stay).
      .filter(
        (outlet) =>
          !hideClustered || selected.has(outlet.id) || !colorByCluster.has(outlet.clusterId)
      )
      .map((outlet) => ({
        id: outlet.id,
        ...coordinates(outlet),
        title: colorByCluster.has(outlet.clusterId)
          ? `${outlet.name} · ${outlet.cluster?.name || 'Cluster'}`
          : outlet.name,
        label: selected.has(outlet.id) ? String(selected.get(outlet.id)) : null,
        icon: {
          path: 0,
          scale: selected.has(outlet.id) ? 11 : 6,
          fillColor: selected.has(outlet.id)
            ? draft.colorHex
            : colorByCluster.get(outlet.clusterId) || '#9ca3af',
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        onClick: step === 2 && !busy && !saving ? () => toggleOutlet(outlet) : undefined,
      }));
    if (centerPoint)
      markers.push({
        id: 'cluster-center',
        ...centerPoint,
        title: 'Titik pusat kluster',
        icon: { path: 0, scale: 8, fillColor: '#111827', strokeColor: '#fff', strokeWeight: 3 },
        zIndex: 999,
      });
    setMarkers(markers);
  }, [
    step,
    isMapReady,
    allOutlets,
    selectedOutlets,
    centerPoint,
    routes,
    activeRouteIndex,
    draft.colorHex,
    toggleOutlet,
    busy,
    saving,
    setMarkers,
    hideClustered,
    colorByCluster,
  ]);
  useEffect(() => {
    let current = true;
    clearPolylines();
    const route = routes[activeRouteIndex];
    if (!route || !isMapReady) return;
    const outlets = new Map(selectedOutlets.map((outlet) => [outlet.id, outlet]));
    const points = route.outletOrder
      .map((item) => outlets.get(item.id))
      .filter(Boolean)
      .map(coordinates);
    if (points.length < 2) return;
    const draw = (path) =>
      setPolylines([
        {
          id: 'cluster-preview',
          googleMapsOnly: points.some((p) => p.googleMapsOnly),
          path,
          color: draft.colorHex,
          isActive: true,
        },
      ]);
    draw(points);
    routingService
      .fetchRoadRoute(points)
      .then((result) => {
        if (current) {
          const path = result.legs.flatMap((leg) => leg.path || []);
          if (path.length) draw(path);
        }
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [
    routes,
    activeRouteIndex,
    selectedOutlets,
    draft.colorHex,
    isMapReady,
    setPolylines,
    clearPolylines,
  ]);
}
