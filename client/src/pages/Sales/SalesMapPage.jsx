import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useMap } from '../../context/MapContext';
import { useWorkspaceState } from '../../shared/hooks/useWorkspaceState';
import { TAB_IDS } from '../../constants/navigation';
import { outletsApi } from '../../services/api';
import { projectOperationalOutlet } from '../../../../shared/outlet-location.mjs';
import { visitStatusLabel } from './salesPresentation';

export function SalesMapPage() {
  const { user, salesStops, syncStatus, setActiveTab } = useApp();
  const {
    setMapMode,
    setMarkers,
    clearMarkers,
    clearPolylines,
    clearPolygons,
    panTo,
    fitBounds,
    isMapReady,
    useFallback,
  } = useMap();
  const [query, setQuery] = useWorkspaceState('salesMapSearch', ''),
    [selectedId, setSelectedId] = useWorkspaceState('salesMapOutlet', ''),
    [scopeMode, setScopeMode] = useState('auto'),
    [clusterOutlets, setClusterOutlets] = useState([]),
    [clusterLoading, setClusterLoading] = useState(true),
    [clusterError, setClusterError] = useState('');

  useEffect(() => {
    if (!user?.id) {
      setClusterOutlets([]);
      setClusterLoading(false);
      setClusterError('');
      return;
    }
    let live = true;
    setClusterLoading(true);
    setClusterError('');
    outletsApi
      .getAll()
      .then((res) => {
        if (!live) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setClusterOutlets(
          list.map((raw, idx) => {
            const o = projectOperationalOutlet(raw);
            return {
              id: `outlet:${o.id}`,
              outletId: o.id,
              sequence: idx + 1,
              outletName: o.name || '',
              outletCode: o.outletCode || '',
              address: o.address || '',
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

  useEffect(() => {
    if (selectedId && !stops.some((s) => s.id === selectedId)) {
      setSelectedId('', { replace: true });
    }
  }, [selectedId, stops, setSelectedId]);

  const valid = useMemo(
    () =>
      stops.filter(
        (s) =>
          s.latitude != null &&
          s.longitude != null &&
          Number.isFinite(Number(s.latitude)) &&
          Number.isFinite(Number(s.longitude)) &&
          Math.abs(Number(s.latitude)) <= 90 &&
          Math.abs(Number(s.longitude)) <= 180
      ),
    [stops]
  );
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
        ? 'Belum ada PJP hari ini — menampilkan semua outlet pada wilayah penugasan Anda. Posisi outlet bukan lokasi langsung Sales.'
        : 'Titik seluruh outlet pada wilayah penugasan Anda. Posisi outlet bukan lokasi langsung Sales.';

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
    setMarkers(
      valid.map((s) => ({
        id: s.id,
        googleMapsOnly: s.googleMapsOnly,
        lat: Number(s.latitude),
        lng: Number(s.longitude),
        title: `${s.sequence}. ${s.outletName}`,
        label: String(s.sequence),
        onClick: () => setSelectedId(s.id),
      }))
    );
  }, [valid, setMarkers, setSelectedId, isMapReady]);
  useEffect(() => {
    if (selected) panTo(Number(selected.latitude), Number(selected.longitude), 16);
    else if (valid.length)
      fitBounds(valid.map((s) => ({ lat: Number(s.latitude), lng: Number(s.longitude) })));
  }, [selected, valid, isMapReady, panTo, fitBounds]);
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
              Wilayah saya ({clusterOutlets.length})
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
                {s.sequence}. {s.outletName}
              </strong>
              <span>{s.address || 'Alamat belum tersedia'}</span>
              <small>
                {s.isClusterOutlet
                  ? s.clusterName || 'Outlet wilayah'
                  : visitStatusLabel(s.status)}
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
                    Lihat Wilayah saya ({clusterOutlets.length})
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
