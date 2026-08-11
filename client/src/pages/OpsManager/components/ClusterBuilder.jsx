import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMapData } from '../../../context/MapDataContext';
import { clustersApi } from '../../../services/api';
import { notifySuccess, notifyError } from '../../../services/notificationService';
import { FaTimes, FaMapMarkerAlt, FaUsers, FaRoute, FaCheck, FaSpinner } from 'react-icons/fa';

// Helper: Build icon for a given outlet given its type and whether it's in the selected set
const buildOutletIcon = (type, isSelected) => ({
  path: window.google?.maps?.SymbolPath?.CIRCLE ?? 0,
  fillColor: type === 'GENERAL_TRADE' ? '#2563eb' : '#9333ea',
  fillOpacity: 1,
  strokeColor: isSelected ? '#facc15' : (type === 'GENERAL_TRADE' ? '#1d4ed8' : '#7e22ce'),
  strokeWeight: isSelected ? 3 : 1,
  scale: isSelected ? 8 : 5,
});

export const ClusterBuilder = ({ mapState, setMapState, setMapHandlers, onClose }) => {
  const { outlets, salesUsers, invalidate } = useMapData();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    colorHex: '#3b82f6',
    outletCount: 10,
    assignedSalesId: ''
  });

  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [nearestOutlets, setNearestOutlets] = useState([]);
  const [generatedRoutes, setGeneratedRoutes] = useState([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Refs so the onMarkerClick handler always sees current values
  // without needing to re-register (which would abort any in-flight async work)
  const isProcessingClickRef = useRef(false);
  const selectedCenterRef = useRef(null); // mirrors selectedCenter state
  const outletCountRef = useRef(formData.outletCount); // mirrors formData.outletCount

  // Keep refs in sync
  useEffect(() => { selectedCenterRef.current = selectedCenter; }, [selectedCenter]);
  useEffect(() => { outletCountRef.current = formData.outletCount; }, [formData.outletCount]);

  // ─── Render initial unassigned outlets on map ────────────────────────────────
  // Only run when step=1 and no center selected, or step changes to 1
  const renderAllOutlets = useCallback(() => {
    if (!window.google) return;
    const unassigned = outlets.filter(o => !o.clusterId || (o.cluster && o.cluster.deletedAt));
    setMapState(prev => ({
      ...prev,
      isVisible: true,
      markers: unassigned.map(o => ({
        id: o.id,
        lat: o.latitude,
        lng: o.longitude,
        type: o.type,
        title: o.name,
        icon: buildOutletIcon(o.type, false),
      })),
      routes: []
    }));
  }, [outlets, setMapState]);

  // On step 1 or when returning from step 2, re-render all outlets
  useEffect(() => {
    if (step === 1) {
      renderAllOutlets();
    }

    return () => {
      if (step === 2) {
        setMapHandlers({ onMapClick: null, onMarkerClick: null });
      }
    };
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // When outlets load and we're on step 1, render them
  useEffect(() => {
    if (step === 1) {
      renderAllOutlets();
    }
  }, [outlets, step, renderAllOutlets]);

  // ─── Map handler for step 2 ──────────────────────────────────────────────────
  // IMPORTANT: deps array intentionally omits selectedCenter & outletCount
  // — they are read via refs so this effect never re-runs (and tears down
  // the handler) while an async operation is in flight.
  useEffect(() => {
    if (step !== 2) return;

    setMapHandlers({
      onMapClick: null,
      onMarkerClick: async (marker) => {
        // Guard: reject any click while a request is already running OR a center already chosen
        if (isProcessingClickRef.current || selectedCenterRef.current) return;

        // Lock immediately — before any await — so double-clicks are impossible
        isProcessingClickRef.current = true;
        setIsLoading(true);

        const latLng = { lat: marker.lat, lng: marker.lng };
        const outletType = marker.type;
        const count = outletCountRef.current;

        // Persist center to ref AND state at the same time
        selectedCenterRef.current = latLng;
        setSelectedCenter(latLng);
        setSelectedType(outletType);

        try {
          const res = await clustersApi.getNearestOutlets(latLng.lat, latLng.lng, count, outletType);
          const nearest = res.data || [];

          if (nearest.length === 0) {
            notifyError('Tidak ada outlet terdekat untuk tipe ini di sekitar titik tersebut');
            selectedCenterRef.current = null;
            setSelectedCenter(null);
            setSelectedType(null);
            return;
          }

          setNearestOutlets(nearest);

          const routeRes = await clustersApi.generateRoutes(nearest.map(o => o.id));
          const routes = routeRes.data || [];
          setGeneratedRoutes(routes);
          setActiveRouteIndex(0);

        } catch (err) {
          console.error('Route calculation error:', err);
          notifyError('Gagal menghitung rute. Coba pilih titik lain.');
          selectedCenterRef.current = null;
          setSelectedCenter(null);
          setSelectedType(null);
          setNearestOutlets([]);
          setGeneratedRoutes([]);
        } finally {
          // Always release the processing lock so future clicks work
          isProcessingClickRef.current = false;
          setIsLoading(false);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, setMapHandlers]); // ← intentionally minimal — see comment above

  // ─── Update map visual after center + routes are set ─────────────────────────
  useEffect(() => {
    if (step !== 2 || !selectedCenter || nearestOutlets.length === 0) return;
    if (!window.google) return;

    const activeRoute = generatedRoutes.find(r => r.routeIndex === activeRouteIndex);
    const unassigned = outlets.filter(o => !o.clusterId || (o.cluster && o.cluster.deletedAt));
    const selectedIds = new Set(nearestOutlets.map(o => o.id));

    const orderedOutlets = activeRoute?.outletOrder
      ? activeRoute.outletOrder
          .map(oo => nearestOutlets.find(no => no.id === oo.id))
          .filter(Boolean)
      : nearestOutlets;

    const path = orderedOutlets.map(o => ({ lat: o.latitude, lng: o.longitude }));

    setMapState(prev => ({
      ...prev,
      center: selectedCenter,
      zoom: 13,
      markers: [
        // Center marker (red pin)
        {
          id: '__center__',
          lat: selectedCenter.lat,
          lng: selectedCenter.lng,
          title: 'Titik Pusat',
          zIndex: 999,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
          }
        },
        // All unassigned outlets — keep full color, highlight selected ones
        ...unassigned.map(o => ({
          id: o.id,
          lat: o.latitude,
          lng: o.longitude,
          type: o.type,
          title: o.name,
          zIndex: selectedIds.has(o.id) ? 100 : 1,
          icon: buildOutletIcon(o.type, selectedIds.has(o.id)),
        }))
      ],
      routes: path.length > 1 ? [{
        id: 'preview-route',
        path,
        color: formData.colorHex,
        isActive: true,
        strokeWeight: 3,
        strokeOpacity: 0.85,
      }] : []
    }));
  }, [step, selectedCenter, nearestOutlets, generatedRoutes, activeRouteIndex, formData.colorHex, outlets, setMapState]);

  // ─── Reset state when going back ─────────────────────────────────────────────
  const handleBack = () => {
    selectedCenterRef.current = null;
    isProcessingClickRef.current = false;
    setSelectedCenter(null);
    setSelectedType(null);
    setNearestOutlets([]);
    setGeneratedRoutes([]);
    setActiveRouteIndex(0);
    setIsLoading(false);
    setStep(1);
  };

  // ─── Save cluster ─────────────────────────────────────────────────────────────
  const handleSaveCluster = async () => {
    try {
      const routesToSave = generatedRoutes.map(r => ({
        ...r,
        isActive: r.routeIndex === activeRouteIndex
      }));

      await clustersApi.createFull({
        name: formData.name,
        region: formData.region,
        colorHex: formData.colorHex,
        centerLat: selectedCenter.lat,
        centerLng: selectedCenter.lng,
        outletCount: formData.outletCount,
        assignedSalesId: formData.assignedSalesId || undefined,
        outletIds: nearestOutlets.map(o => o.id),
        routes: routesToSave
      });

      notifySuccess('Cluster berhasil dibuat!');
      invalidate('clusters');
      onClose();
    } catch (err) {
      console.error(err);
      notifyError('Gagal membuat cluster');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  const stepLabels = ['Info Dasar', 'Area & Rute', 'Sales', 'Simpan'];

  return (
    <div className="absolute inset-0 z-20 flex pointer-events-none p-4 md:p-8 justify-end">
      <div className="bg-card w-full md:w-[420px] rounded-xl shadow-2xl border border-border flex flex-col pointer-events-auto h-full max-h-full overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30 flex-shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaRoute className="text-primary" />
            Buat Cluster Baru
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <FaTimes />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex-shrink-0">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-border mx-6" />
            {stepLabels.map((label, i) => {
              const s = i + 1;
              const isActive = step === s;
              const isDone = step > s;
              return (
                <div key={s} className="flex flex-col items-center relative z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isDone ? 'bg-green-500 text-white' :
                    isActive ? 'bg-primary text-primary-foreground' :
                    'bg-border text-muted-foreground'
                  }`}>
                    {isDone ? <FaCheck /> : s}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nama Cluster <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Contoh: Bandung Selatan A"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Wilayah (Region) <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Contoh: Jawa Barat"
                  value={formData.region}
                  onChange={e => setFormData({ ...formData, region: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Jumlah Target Outlet</label>
                <input
                  type="number"
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formData.outletCount}
                  min="1"
                  onChange={e => setFormData({ ...formData, outletCount: parseInt(e.target.value, 10) })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Warna Cluster</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-9 w-9 p-0 border-0 rounded cursor-pointer"
                    value={formData.colorHex}
                    onChange={e => setFormData({ ...formData, colorHex: e.target.value })}
                  />
                  <span className="text-sm font-mono">{formData.colorHex}</span>
                </div>
              </div>

              {/* Legend */}
              <div className="bg-muted/40 rounded-md p-3 text-xs space-y-1">
                <p className="font-semibold text-muted-foreground mb-2">Keterangan Warna Outlet di Peta:</p>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600 inline-block flex-shrink-0" />
                  <span>General Trade</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-600 inline-block flex-shrink-0" />
                  <span>Modern Trade</span>
                </div>
              </div>

              <button
                className="w-full btn btn-primary mt-2"
                disabled={!formData.name || !formData.region}
                onClick={() => setStep(2)}
              >
                Lanjut ke Peta
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4 pt-1">
              {!selectedCenter ? (
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-md text-sm text-blue-200">
                  <p className="flex items-start gap-2">
                    <FaMapMarkerAlt className="mt-1 flex-shrink-0" />
                    <span>
                      <strong>Klik salah satu titik outlet</strong> pada peta untuk memilih area cluster.
                      Sistem akan otomatis mencari <strong>{formData.outletCount}</strong> outlet terdekat dan membuat 3 alternatif rute optimal.
                    </span>
                  </p>
                </div>
              ) : isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground">
                  <FaSpinner className="animate-spin text-2xl text-primary" />
                  <p className="text-sm">Menghitung rute optimal...</p>
                  <p className="text-xs opacity-70">Harap tunggu, proses ini mungkin memakan beberapa detik</p>
                </div>
              ) : (
                <>
                  {/* Center info */}
                  <div className="bg-muted/50 p-3 rounded-md space-y-1">
                    <div className="text-xs text-muted-foreground">Titik Pusat (Koordinat):</div>
                    <div className="font-mono text-sm">{selectedCenter.lat.toFixed(5)}, {selectedCenter.lng.toFixed(5)}</div>
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Tipe</div>
                        <div className="text-sm font-semibold" style={{ color: selectedType === 'GENERAL_TRADE' ? '#2563eb' : '#9333ea' }}>
                          {selectedType === 'GENERAL_TRADE' ? 'General Trade' : 'Modern Trade'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Outlet Terpilih</div>
                        <div className="text-sm font-semibold text-primary">{nearestOutlets.length}</div>
                      </div>
                    </div>
                  </div>

                  {/* Route picker */}
                  {generatedRoutes.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground block">Pilih Rute Aktif (3 Alternatif):</label>
                      <p className="text-xs text-muted-foreground">Semua rute akan disimpan. Sales dapat mengganti rute aktif kapan saja.</p>
                      <div className="space-y-2">
                        {generatedRoutes.map(r => (
                          <div
                            key={r.routeIndex}
                            onClick={() => setActiveRouteIndex(r.routeIndex)}
                            className={`p-3 rounded-md border cursor-pointer transition-all ${
                              activeRouteIndex === r.routeIndex
                                ? 'bg-primary/15 border-primary shadow-sm'
                                : 'bg-background border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm">
                                {activeRouteIndex === r.routeIndex && '✓ '} Rute {r.routeIndex + 1}
                              </span>
                              {activeRouteIndex === r.routeIndex && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Aktif</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Jarak: <strong className="text-foreground">{r.totalDistanceKm} km</strong>
                              {r.startOutletId && <span className="ml-2 opacity-60">• Mulai dari titik {r.routeIndex + 1}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outlet list */}
                  {nearestOutlets.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground block">Outlet Terpilih ({nearestOutlets.length}):</label>
                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                        {nearestOutlets.map((o, idx) => (
                          <div key={o.id} className="flex items-start gap-2 p-2 bg-muted/30 rounded text-xs">
                            <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${o.type === 'GENERAL_TRADE' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                            <div>
                              <div className="font-medium">{idx + 1}. {o.name}</div>
                              <div className="text-muted-foreground">{o.address || '-'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                    onClick={() => {
                      selectedCenterRef.current = null;
                      isProcessingClickRef.current = false;
                      setSelectedCenter(null);
                      setSelectedType(null);
                      setNearestOutlets([]);
                      setGeneratedRoutes([]);
                      setIsLoading(false);
                      renderAllOutlets();
                    }}
                  >
                    Pilih Titik Lain
                  </button>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <button className="flex-1 btn btn-secondary" onClick={handleBack}>Kembali</button>
                <button
                  className="flex-1 btn btn-primary"
                  disabled={!selectedCenter || nearestOutlets.length === 0 || isLoading}
                  onClick={() => setStep(3)}
                >
                  Lanjut
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Assign Sales (Opsional)</label>
                <select
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={formData.assignedSalesId}
                  onChange={e => setFormData({ ...formData, assignedSalesId: e.target.value })}
                >
                  <option value="">Pilih Sales Nanti</option>
                  {salesUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>

              <div className="bg-primary/10 border border-primary/20 p-4 rounded-md">
                <h4 className="font-semibold text-primary mb-3">Ringkasan Cluster</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>Nama: <strong className="text-foreground">{formData.name}</strong></li>
                  <li>Region: <strong className="text-foreground">{formData.region}</strong></li>
                  <li>Total Outlet: <strong className="text-foreground">{nearestOutlets.length}</strong></li>
                  <li>Tipe: <strong className="text-foreground">{selectedType === 'GENERAL_TRADE' ? 'General Trade' : 'Modern Trade'}</strong></li>
                  <li>Rute Aktif: <strong className="text-foreground">Rute {activeRouteIndex + 1} ({generatedRoutes.find(r => r.routeIndex === activeRouteIndex)?.totalDistanceKm} km)</strong></li>
                  <li>Total Alternatif Rute Disimpan: <strong className="text-foreground">{generatedRoutes.length}</strong></li>
                </ul>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="flex-1 btn btn-secondary" onClick={() => setStep(2)}>Kembali</button>
                <button className="flex-1 btn btn-primary flex justify-center items-center gap-2" onClick={handleSaveCluster}>
                  <FaCheck /> Simpan Cluster
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
