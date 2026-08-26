import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { usersApi } from '../../../services/api';
import {
  LuNavigation,
  LuRefreshCw,
  LuRadio,
  LuUser,
  LuStore,
  LuMapPin,
  LuClock,
  LuSearch,
  LuZap,
} from 'react-icons/lu';

// Helper to create live pulsating sales avatar marker
const makeSalesLiveIcon = (salesName, isOnline, activityStatus) => {
  const initials = (salesName || 'S')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const color =
    activityStatus === 'IN_VISIT'
      ? '#16a34a' // Green (in visit)
      : activityStatus === 'TRAVELING'
      ? '#2563eb' // Blue (traveling)
      : isOnline
      ? '#d97706' // Amber (idle)
      : '#6b7280'; // Gray (offline)

  const pulseHtml = isOnline
    ? `<span style="position:absolute;top:-4px;left:-4px;width:44px;height:44px;border-radius:50%;background:${color};opacity:0.35;animation:livePulse 1.5s infinite;"></span>`
    : '';

  const html = `
    <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
      ${pulseHtml}
      <div style="width:34px;height:34px;border-radius:50%;background:${color};color:#fff;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.3);position:relative;z-index:2;">
        ${initials}
      </div>
      <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);background:#1f2937;color:#fff;font-size:9px;font-weight:800;padding:1px 5px;border-radius:6px;white-space:nowrap;z-index:3;box-shadow:0 1px 4px rgba(0,0,0,0.3);">
        ${(salesName || '').split(' ')[0]}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'live-sales-marker',
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

const FlyToSalesLocation = ({ selectedSales }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedSales && selectedSales.latitude && selectedSales.longitude) {
      map.flyTo([selectedSales.latitude, selectedSales.longitude], 15, {
        duration: 1.2,
      });
    }
  }, [selectedSales, map]);
  return null;
};

/**
 * LiveSalesGpsTrackingTab Component
 * Single Responsibility: Real-time interactive GPS map tracking and live location list of sales personnel.
 */
export const LiveSalesGpsTrackingTab = () => {
  const [salesLocations, setSalesLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [selectedSales, setSelectedSales] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'IN_VISIT' | 'TRAVELING' | 'ONLINE'
  const [search, setSearch] = useState('');

  const fetchLocations = async () => {
    try {
      const res = await usersApi.getLiveLocations();
      const list = res?.data || res || [];
      setSalesLocations(list);
      setLastRefreshed(new Date());
    } catch (err) {
      console.warn('[LiveGPS] Error fetching sales locations:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll live GPS coordinates every 10 seconds
  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredSales = salesLocations.filter((s) => {
    const matchSearch =
      (s.salesName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.clusterName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.activityDescription || '').toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (filterStatus === 'IN_VISIT') return s.activityStatus === 'IN_VISIT';
    if (filterStatus === 'TRAVELING') return s.activityStatus === 'TRAVELING';
    if (filterStatus === 'ONLINE') return s.isOnline;
    return true;
  });

  const onlineCount = salesLocations.filter((s) => s.isOnline).length;
  const inVisitCount = salesLocations.filter((s) => s.activityStatus === 'IN_VISIT').length;

  return (
    <div className="space-y-4">
      {/* 1. Header Control Bar */}
      <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-on-surface m-0 uppercase tracking-tight flex items-center gap-2">
              <LuRadio className="text-primary animate-pulse text-base" /> Pemantauan Posisi GPS Real-Time Sales
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 text-[10px] font-black border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live GPS
            </span>
          </div>
          <p className="text-xs text-on-surface-variant m-0 mt-0.5">
            Melacak posisi fisik sales di peta, status kunjungan toko, kecepatan perjalanan, dan progress PJP harian.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <span className="text-[11px] text-on-surface-variant font-mono">
            Diperbarui: {lastRefreshed.toLocaleTimeString('id-ID')}
          </span>
          <button
            type="button"
            onClick={fetchLocations}
            className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-bold flex items-center gap-1.5 border border-border-glass transition-all cursor-pointer"
          >
            <LuRefreshCw className={isLoading ? 'animate-spin text-primary' : ''} /> Segarkan
          </button>
        </div>
      </div>

      {/* 2. Main Layout: Left Sidebar List + Right Interactive GPS Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Side: Sales List & Filter Panel */}
        <div className="lg:col-span-4 space-y-3 bg-surface border border-border-glass rounded-2xl p-3.5 shadow-sm">
          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'ALL'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              Semua ({salesLocations.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('IN_VISIT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'IN_VISIT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-surface-container text-emerald-700 hover:bg-emerald-500/10'
              }`}
            >
              🟢 Di Toko ({inVisitCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('ONLINE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === 'ONLINE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-surface-container text-blue-700 hover:bg-blue-500/10'
              }`}
            >
              Aktif ({onlineCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs" />
            <input
              type="text"
              placeholder="Cari nama sales atau klaster..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface-container rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Sales List Items */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredSales.map((s) => {
              const isSelected = selectedSales?.salesId === s.salesId;
              const isVisiting = s.activityStatus === 'IN_VISIT';
              const isTraveling = s.activityStatus === 'TRAVELING';

              return (
                <div
                  key={s.salesId}
                  onClick={() => setSelectedSales(s)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-primary/10 border-primary shadow-xs'
                      : 'bg-surface-container/40 hover:bg-surface-container border-border-glass'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0 ${
                          isVisiting
                            ? 'bg-emerald-600'
                            : isTraveling
                            ? 'bg-blue-600'
                            : s.isOnline
                            ? 'bg-amber-600'
                            : 'bg-gray-500'
                        }`}
                      >
                        {(s.salesName || 'S').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-on-surface m-0 leading-tight">
                          {s.salesName}
                        </h4>
                        <span className="text-[10px] text-on-surface-variant font-medium">
                          {s.clusterName}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[9.5px] font-black ${
                        isVisiting
                          ? 'bg-emerald-500/15 text-emerald-700'
                          : isTraveling
                          ? 'bg-blue-500/15 text-blue-700'
                          : s.isOnline
                          ? 'bg-amber-500/15 text-amber-700'
                          : 'bg-gray-500/10 text-gray-600'
                      }`}
                    >
                      {isVisiting
                        ? '🟢 Di Toko'
                        : isTraveling
                        ? '🚗 Di Jalan'
                        : s.isOnline
                        ? '🟡 Online'
                        : 'Offline'}
                    </span>
                  </div>

                  {/* Activity Details & Progress */}
                  <p className="text-[11px] text-on-surface font-semibold m-0 truncate">
                    {s.activityDescription}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono pt-1 border-t border-border-glass/60">
                    <span>
                      PJP: <strong>{s.pjpProgress?.completedStops}/{s.pjpProgress?.totalStops} Toko</strong> ({s.pjpProgress?.progressPercent}%)
                    </span>
                    <span className="text-primary font-bold">Fokus Peta &rarr;</span>
                  </div>
                </div>
              );
            })}

            {filteredSales.length === 0 && (
              <div className="py-8 text-center text-xs text-on-surface-variant">
                Tidak ada data sales yang cocok.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Leaflet Live Map */}
        <div className="lg:col-span-8 bg-surface border border-border-glass rounded-2xl p-2 shadow-sm overflow-hidden relative">
          <style>{`
            @keyframes livePulse {
              0% { transform: scale(0.8); opacity: 0.7; }
              50% { transform: scale(1.3); opacity: 0.2; }
              100% { transform: scale(1.6); opacity: 0; }
            }
          `}</style>

          <div className="w-full h-[580px] rounded-xl overflow-hidden relative z-0">
            <MapContainer
              center={[-6.884984, 107.489953]}
              zoom={12}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FlyToSalesLocation selectedSales={selectedSales} />

              {/* Breadcrumb Trail for Selected Sales */}
              {selectedSales?.breadcrumbs?.length > 1 && (
                <Polyline
                  positions={selectedSales.breadcrumbs.map((b) => [b.lat, b.lng])}
                  pathOptions={{ color: '#2563eb', weight: 4, dashArray: '6, 8', opacity: 0.7 }}
                />
              )}

              {/* Markers for All Sales */}
              {salesLocations.map((s) => (
                <Marker
                  key={s.salesId}
                  position={[s.latitude, s.longitude]}
                  icon={makeSalesLiveIcon(s.salesName, s.isOnline, s.activityStatus)}
                >
                  <Popup>
                    <div style={{ fontSize: '12px', minWidth: '220px', lineHeight: '1.4' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '13px', color: '#1f2937' }}>{s.salesName}</strong>
                        <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '6px', background: s.isOnline ? '#dcfce7' : '#f3f4f6', color: s.isOnline ? '#15803d' : '#6b7280' }}>
                          {s.activityStatus}
                        </span>
                      </div>

                      <div style={{ marginBottom: '4px' }}>
                        <span style={{ color: '#6b7280', fontSize: '11px', display: 'block' }}>Wilayah Klaster:</span>
                        <strong style={{ color: '#374151' }}>{s.clusterName}</strong>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '6px' }}>
                        <span style={{ color: '#475569', fontSize: '11px', fontWeight: '600', display: 'block' }}>
                          {s.activityDescription}
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        <div>Progress PJP: <b>{s.pjpProgress?.completedStops} / {s.pjpProgress?.totalStops} Toko ({s.pjpProgress?.progressPercent}%)</b></div>
                        {s.pjpProgress?.nextStopName && (
                          <div style={{ marginTop: '2px', color: '#2563eb', fontWeight: '600' }}>
                            Tujuan Berikutnya: {s.pjpProgress.nextStopName}
                            {s.pjpProgress.distanceToNextStopMeters && ` (~${(s.pjpProgress.distanceToNextStopMeters / 1000).toFixed(1)} km)`}
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #f1f5f9', fontSize: '9.5px', color: '#94a3b8', fontFamily: 'monospace' }}>
                        Koordinat: {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

