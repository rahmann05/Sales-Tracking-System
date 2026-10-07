import { FlyToSalesLocation } from './FlyToSalesLocation';
import { LiveSalesTrackingView } from './LiveSalesTrackingView';
import React, { useState, useEffect } from "react";

import L from 'leaflet';
import { usersApi } from '../../../services/api';
import { LuRefreshCw, LuRadio } from "react-icons/lu";

// Icon cache to avoid DOM thrashing in Leaflet (Google Web Performance Best Practice)
const iconCache = new Map();

// Helper to create live pulsating sales avatar marker
const makeSalesLiveIcon = (salesName, isOnline, activityStatus) => {
  const cacheKey = `${salesName}_${isOnline}_${activityStatus}`;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }
  const initials = (salesName || 'S').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const color = activityStatus === 'IN_VISIT' ? '#16a34a' // Green (in visit)
  : activityStatus === 'TRAVELING' ? '#2563eb' // Blue (traveling)
  : isOnline ? '#d97706' // Amber (idle)
  : '#6b7280'; // Gray (offline)

  const pulseHtml = isOnline ? `<span style="position:absolute;top:-4px;left:-4px;width:44px;height:44px;border-radius:50%;background:${color};opacity:0.35;animation:livePulse 2s infinite ease-out;will-change:transform,opacity;transform:translateZ(0);"></span>` : '';
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
  const icon = L.divIcon({
    className: 'live-sales-marker',
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
  iconCache.set(cacheKey, icon);
  return icon;
};
/**
 * LiveSalesGpsTrackingTab Component
 * Single Responsibility: Real-time interactive GPS map tracking and live location list of sales personnel.
 */
export const LiveSalesGpsTrackingTab = ({
  onSelectSalesId,
  spvStops = []
}) => {
  const [salesLocations, setSalesLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [selectedSales, setSelectedSales] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ONLINE'); // 'ONLINE' | 'IN_VISIT' | 'ALL'
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

  // Poll live GPS coordinates every 20 seconds, pausing when document is hidden (Google Web Vitals Best Practice)
  useEffect(() => {
    fetchLocations();
    const interval = setInterval(() => {
      if (document.hidden) return; // Pause polling when user is not viewing this tab/window
      fetchLocations();
    }, 20000);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchLocations();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  const filteredSales = salesLocations.filter(s => {
    const matchSearch = (s.salesName || '').toLowerCase().includes(search.toLowerCase()) || (s.clusterName || '').toLowerCase().includes(search.toLowerCase()) || (s.activityDescription || '').toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filterStatus === 'IN_VISIT') return s.activityStatus === 'IN_VISIT';
    if (filterStatus === 'TRAVELING') return s.activityStatus === 'TRAVELING';
    if (filterStatus === 'ONLINE') return s.isOnline;
    return true;
  });
  const onlineCount = salesLocations.filter(s => s.isOnline).length;
  const inVisitCount = salesLocations.filter(s => s.activityStatus === 'IN_VISIT').length;
  return <div className="space-y-4">
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
          <button type="button" onClick={fetchLocations} className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-bold flex items-center gap-1.5 border border-border-glass transition-all cursor-pointer">
            <LuRefreshCw className={isLoading ? 'animate-spin text-primary' : ''} /> Segarkan
          </button>
        </div>
      </div>

      {/* 2. Main Layout: Left Sidebar List + Right Interactive GPS Map */}
      <LiveSalesTrackingView FlyToSalesLocation={FlyToSalesLocation} filterStatus={filterStatus} filteredSales={filteredSales} inVisitCount={inVisitCount} makeSalesLiveIcon={makeSalesLiveIcon} onSelectSalesId={onSelectSalesId} onlineCount={onlineCount} salesLocations={salesLocations} search={search} selectedSales={selectedSales} setFilterStatus={setFilterStatus} setSearch={setSearch} setSelectedSales={setSelectedSales} spvStops={spvStops} />
    </div>;
};
