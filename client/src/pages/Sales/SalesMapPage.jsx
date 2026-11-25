import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useMap } from '../../context/MapContext';
import { useWorkspaceState } from '../../shared/hooks/useWorkspaceState';
import { TAB_IDS } from '../../constants/navigation';
import { clustersApi, outletsApi } from '../../services/api';
import { projectOperationalOutlet } from '../../../../shared/outlet-location.mjs';
import { computeClusterPolygons } from '../../utils/clusterBoundaryHelper';
import { resolveClusterColor } from '../Dashboard/dashboardMapHelpers';
import { visitStatusLabel } from './salesPresentation';

const NEUTRAL = '#64748b';
const asList = (res) => (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
const validPoint = (s) =>
  s.latitude != null &&
  s.longitude != null &&
  Number.isFinite(Number(s.latitude)) &&
  Number.isFinite(Number(s.longitude)) &&
  Math.abs(Number(s.latitude)) <= 90 &&
  Math.abs(Number(s.longitude)) <= 180;
// The server already limits clusters and outlets to the signed-in role (Sales: own clusters,
// Supervisor: supervised clusters, Admin: all); only the wording changes here.
const SCOPE_TEXT = {
  SALES: { tab: 'Wilayah saya', note: 'wilayah penugasan Anda' },
  SUPERVISOR: { tab: 'Wilayah tim', note: 'wilayah tim Anda' },
  ADMIN: { tab: 'Semua wilayah', note: 'seluruh wilayah' },
};
/** Active suggested route stored on the cluster, as ordered outlet ids. */
function suggestedRoute(cluster) {
  const routes = Array.isArray(cluster.routes) ? cluster.routes : [];
  const route = routes.find((r) => r?.isActive) || routes[0];
  const order = Array.isArray(route?.outletOrder) ? route.outletOrder : [];
  const ids = order
    .map((item) => (typeof item === 'string' ? item : item?.id || item?.outletId))
    .filter(Boolean);
  return ids.length > 1 ? { ids, fallbackPath: route.overviewPath } : null;
}

export function SalesMapPage() {
  const { user, salesStops, syncStatus, setActiveTab } = useApp();
  const {
    setMapMode,
    setMarkers,
    setPolylines,
    setPolygons,
    clearMarkers,
    clearPolylines,
    clearPolygons,
    panTo,
    fitBounds,
    isMapReady,
    useFallback,
  } = useMap();
  const wording = SCOPE_TEXT[user?.role] || SCOPE_TEXT.SALES;
  const [query, setQuery] = useWorkspaceState('salesMapSearch', ''),
    [selectedId, setSelectedId] = useWorkspaceState('salesMapOutlet', ''),
    [scopeMode, setScopeMode] = useState('auto'),
    [showRoute, setShowRoute] = useState(true),
    [clusterOutlets, setClusterOutlets] = useState([]),
    [clusters, setClusters] = useState([]),
    [clusterLoading, setClusterLoading] = useState(true),
    [clusterError, setClusterError] = useState('');

  useEffect(() => {
    if (!user?.id) {
      setClusterOutlets([]);
      setClusters([]);
      setClusterLoading(false);
      setClusterError('');
      return;
    }
    let live = true;
    setClusterLoading(true);
    setClusterError('');
    Promise.all([outletsApi.getAll(), clustersApi.getAll().catch(() => null)])
      .then(([outletRes, clusterRes]) => {
        if (!live) return;
        setClusters(asList(clusterRes));
        setClusterOutlets(
          asList(outletRes).map((raw) => {
            const o = projectOperationalOutlet(raw);
            return {
              id: `outlet:${o.id}`,
              outletId: o.id,
              outletName: o.name || '',
              outletCode: o.outletCode || '',
              address: o.address || '',
              clusterId: o.clusterId || o.cluster?.id || null,
              clusterName: o.cluster?.name || '',
              latitude: o.latitude,
              longitude: o.longitude,
              googleMapsOnly: Boolean(o.googleMapsOnly),
              status: null,
              isClusterOutlet: true,
            };
          })
        );
      })
      .catch((err) => {
        if (live) setClusterError(err.message || 'Gagal memuat outlet wilayah.');
      })
      .finally(() => {
        if (live) setClusterLoading(false);
      });
    return () => {
      live = false;
    };
  }, [user?.id]);

  const pjpStops = useMemo(
    () => [...salesStops].sort((a, b) => a.sequence - b.sequence),
    [salesStops]
  );
  const activeScope = scopeMode === 'auto' ? (pjpStops.length > 0 ? 'pjp' : 'cluster') : scopeMode;
  const stops = activeScope === 'pjp' ? pjpStops : clusterOutlets;

  // One color per cluster, shared by markers, area outline, route line and the legend.
  const colorByCluster = useMemo(
    () => new Map(clusters.map((c, i) => [c.id, resolveClusterColor(c, i)])),
    [clusters]
  );
  const colorFor = (s) => {
    const id = s.clusterId || s.outlet?.clusterId;
    if (id && colorByCluster.has(id)) return colorByCluster.get(id);
    const byName = clusters.find(
      (c) => c.name && c.name === (s.clusterName || s.outlet?.cluster?.name)
    );
    return byName ? colorByCluster.get(byName.id) : NEUTRAL;
  };

  useEffect(() => {
    if (selectedId && !stops.some((s) => s.id === selectedId)) {
      setSelectedId('', { replace: true });
    }
  }, [selectedId, stops, setSelectedId]);

  const valid = useMemo(() => stops.filter(validPoint), [stops]);
  const selected = valid.find((s) => s.id === selectedId),
    filtered = stops.filter((s) =>
      `${s.outletName || ''} ${s.outletCode || ''} ${s.address || ''}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
    );
  const isLoading =
    (activeScope === 'pjp' && !syncStatus?.lastSuccessAt && !syncStatus?.error) ||
    (activeScope === 'cluster' && clusterLoading);
  const activeError = activeScope === 'pjp' ? syncStatus?.error : clusterError;
  const headingNote =
    activeScope === 'pjp'
      ? 'Titik outlet dari PJP hari ini. Posisi outlet bukan lokasi langsung Sales.'
      : pjpStops.length === 0
        ? `Belum ada PJP hari ini — menampilkan semua outlet pada ${wording.note}. Posisi outlet bukan lokasi langsung Sales.`
        : `Titik seluruh outlet pada ${wording.note}. Posisi outlet bukan lokasi langsung Sales.`;

  // Legend: every cluster in scope with its color, outlet count and whether a route is stored.
  const legend = useMemo(() => {
    const counts = new Map();
    for (const o of clusterOutlets) counts.set(o.clusterId, (counts.get(o.clusterId) || 0) + 1);
    return clusters.map((c) => ({
      id: c.id,
      name: c.name,
      color: colorByCluster.get(c.id),
      count: counts.get(c.id) || 0,
      route: suggestedRoute(c),
    }));
  }, [clusters, clusterOutlets, colorByCluster]);

  useEffect(() => {
    setMapMode('dashboard');
    return () => {
      setMapMode('hidden');
      clearMarkers();
      clearPolylines();
      clearPolygons();
    };
  }, [setMapMode, clearMarkers, clearPolylines, clearPolygons]);

  useEffect(() => {
    const territory = activeScope === 'cluster';
    setMarkers(
      valid.map((s) => ({
        id: s.id,
        googleMapsOnly: s.googleMapsOnly,
        lat: Number(s.latitude),
        lng: Number(s.longitude),
        title: territory
          ? `${s.outletName}${s.clusterName ? ` · ${s.clusterName}` : ''}`
          : `${s.sequence}. ${s.outletName}`,
        // Territory markers carry no number: clusters differ, so only color identifies them.
        label: territory ? undefined : String(s.sequence),
        icon: {
          scale: territory ? 6 : 10,
          fillColor: colorFor(s),
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        onClick: () => setSelectedId(s.id),
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, activeScope, colorByCluster, setMarkers, setSelectedId, isMapReady]);

  // Area outline per cluster.
  useEffect(() => {
    if (activeScope !== 'cluster' || !clusters.length) {
      clearPolygons();
      return;
    }
    setPolygons(
      computeClusterPolygons(
        clusters,
        clusterOutlets.filter(validPoint).map((o) => ({ ...o, id: o.outletId }))
      ).map((poly) => ({
        ...poly,
        color: colorByCluster.get(poly.id) || poly.color,
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillOpacity: 0.08,
      }))
    );
  }, [
    activeScope,
    clusters,
    clusterOutlets,
    colorByCluster,
    setPolygons,
    clearPolygons,
    isMapReady,
  ]);

  // Suggested visit flow stored with each cluster (ClusterRoute), drawn only when present.
  useEffect(() => {
    if (activeScope !== 'cluster' || !showRoute) {
      clearPolylines();
      return;
    }
    const byId = new Map(clusterOutlets.map((o) => [o.outletId, o]));
    const lines = [];
    for (const c of clusters) {
      const route = suggestedRoute(c);
      if (!route) continue;
      let path = route.ids
        .map((id) => byId.get(id))
        .filter((o) => o && validPoint(o))
        .map((o) => ({ lat: Number(o.latitude), lng: Number(o.longitude) }));
      if (path.length < 2 && Array.isArray(route.fallbackPath)) path = route.fallbackPath;
      if (path.length < 2) continue;
      lines.push({
        id: `route:${c.id}`,
        path,
        color: colorByCluster.get(c.id),
        isActive: false,
        strokeWeight: 2,
        strokeOpacity: 0.5,
      });
    }
    setPolylines(lines);
  }, [
    activeScope,
    showRoute,
    clusters,
    clusterOutlets,
    colorByCluster,
    setPolylines,
    clearPolylines,
    isMapReady,
  ]);

  useEffect(() => {
    if (selected) panTo(Number(selected.latitude), Number(selected.longitude), 16);
    else if (valid.length)
      fitBounds(valid.map((s) => ({ lat: Number(s.latitude), lng: Number(s.longitude) })));
  }, [selected, valid, isMapReady, panTo, fitBounds]);

  const hasRoute = legend.some((l) => l.route);
  return (
    <div className="sales-map-workspace">
      <header className="sales-panel sales-map-heading">
        <div>
          <p className="admin-eyebrow">Sales / Wilayah kunjungan</p>
          <h1>Peta outlet</h1>
          <p className="sales-note">{headingNote}</p>
        </div>
        <button className="app-button" onClick={() => setActiveTab(TAB_IDS.SALES_VISITS)}>
          Buka kunjungan
        </button>
      </header>
      <section className="sales-panel sales-map-list" aria-label="Outlet pada peta">
        <div className="sales-toolbar">
          <div className="sales-map-scope" role="group" aria-label="Sumber data outlet">
            <button
              type="button"
              className="sales-map-scope-btn"
              aria-pressed={activeScope === 'pjp'}
              onClick={() => setScopeMode('pjp')}
            >
              PJP hari ini ({pjpStops.length})
            </button>
            <button
              type="button"
              className="sales-map-scope-btn"
              aria-pressed={activeScope === 'cluster'}
              onClick={() => setScopeMode('cluster')}
            >
              {wording.tab} ({clusterOutlets.length})
            </button>
          </div>
          <label>
            Cari outlet
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value, { replace: true })}
              placeholder="Nama, kode, atau alamat…"
            />
          </label>
        </div>
        {activeScope === 'cluster' && legend.length > 0 && (
          <div className="sales-map-legend" aria-label="Keterangan klaster">
            <ul>
              {legend.map((l) => (
                <li key={l.id}>
                  <i style={{ background: l.color }} aria-hidden="true" />
                  <span>{l.name}</span>
                  <small>
                    {l.count} outlet
                    {l.route ? ` · saran rute ${l.route.ids.length} titik` : ''}
                  </small>
                </li>
              ))}
            </ul>
            {hasRoute && (
              <label className="sales-map-legend-toggle">
                <input
                  type="checkbox"
                  checked={showRoute}
                  onChange={(e) => setShowRoute(e.target.checked)}
                />
                Tampilkan saran rute
              </label>
            )}
          </div>
        )}
        {isLoading && (
          <p role="status" className="sales-empty">
            Memuat outlet…
          </p>
        )}
        {activeError && (
          <p role="alert" className="app-error">
            Data belum diperbarui: {activeError}
          </p>
        )}
        <div className="sales-map-rows">
          {filtered.map((s) => (
            <button
              className="sales-map-row"
              key={s.id}
              aria-pressed={s.id === selectedId}
              disabled={!valid.some((v) => v.id === s.id)}
              onClick={() => setSelectedId(s.id)}
            >
              <strong>
                {s.isClusterOutlet ? (
                  <i
                    className="sales-map-dot"
                    style={{ background: colorFor(s) }}
                    aria-hidden="true"
                  />
                ) : (
                  `${s.sequence}. `
                )}
                {s.outletName}
              </strong>
              <span>{s.address || 'Alamat belum tersedia'}</span>
              <small>
                {s.isClusterOutlet ? s.clusterName || 'Outlet wilayah' : visitStatusLabel(s.status)}
                {!valid.some((v) => v.id === s.id) ? ' · Koordinat belum tersedia' : ''}
              </small>
            </button>
          ))}
          {!isLoading && !activeError && !filtered.length && (
            <div className="sales-empty">
              {activeScope === 'pjp' && !query.trim() && clusterOutlets.length > 0 ? (
                <>
                  <p>Belum ada PJP hari ini.</p>
                  <button
                    type="button"
                    className="app-button sales-map-empty-cta"
                    onClick={() => setScopeMode('cluster')}
                  >
                    Lihat {wording.tab} ({clusterOutlets.length})
                  </button>
                </>
              ) : (
                <p>Tidak ada outlet untuk ditampilkan.</p>
              )}
            </div>
          )}
        </div>
        <p className="sales-map-caption">
          {valid.length} dari {stops.length} outlet memiliki koordinat.
          {useFallback ? ' Peta alternatif OpenStreetMap aktif.' : ''}
        </p>
      </section>
      {selected && (
        <section className="sales-panel sales-map-selection">
          <strong>{selected.outletName}</strong>
          <p className="sales-note">{selected.address}</p>
          <a
            className="app-button"
            href={`https://www.google.com/maps/search/?api=1&query=${selected.latitude},${selected.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buka petunjuk lokasi
          </a>
        </section>
      )}
    </div>
  );
}
