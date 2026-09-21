import React, { useState, useEffect, useMemo } from 'react';
import { deliveryApi } from '../../../services/api';
import { LuTruck, LuPackage, LuMapPin, LuCircleCheck, LuClock, LuRefreshCw, LuCalendar } from 'react-icons/lu';

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'var(--on-surface-variant)', bg: 'var(--surface-variant)' },
  READY: { label: 'Siap Kirim', color: '#2563eb', bg: '#dbeafe' },
  IN_TRANSIT: { label: 'Dalam Perjalanan', color: '#d97706', bg: '#fef3c7' },
  COMPLETED: { label: 'Selesai', color: '#16a34a', bg: '#dcfce7' },
  PARTIAL: { label: 'Sebagian', color: '#dc2626', bg: '#fee2e2' },
};

const STOP_STATUS_CONFIG = {
  PENDING: { label: 'Menunggu', color: '#6b7280' },
  DELIVERED: { label: 'Terkirim', color: '#16a34a' },
  REJECTED: { label: 'Ditolak', color: '#dc2626' },
  PARTIAL_REJECT: { label: 'Sebagian Ditolak', color: '#d97706' },
};

/**
 * WarehouseDashboard — Daily overview for Kepala Gudang.
 * Shows summary metrics, route status, and live delivery tracking.
 */
export const WarehouseDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await deliveryApi.getDashboard({ date: selectedDate });
      if (res.success) setDashboard(res.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedDate]);

  const summary = dashboard?.summary || {};
  const routes = dashboard?.routes || [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-16 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <LuTruck className="text-primary" />
            Dashboard Pengiriman
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Monitor semua pengiriman hari ini</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <LuCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl border border-border-glass bg-surface text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={fetchDashboard}
            className="p-2 rounded-xl border border-border-glass bg-surface hover:bg-surface-variant transition-colors"
            title="Refresh"
          >
            <LuRefreshCw className={`text-on-surface-variant ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={LuTruck} label="Total Rute" value={summary.totalRoutes || 0} color="#2563eb" />
        <SummaryCard icon={LuTruck} label="Kendaraan Aktif" value={summary.totalVehicles || 0} color="#7c3aed" />
        <SummaryCard icon={LuMapPin} label="Total Toko" value={summary.totalStops || 0} color="#d97706" />
        <SummaryCard icon={LuPackage} label="Total Karton" value={summary.totalCartons || 0} color="#16a34a" />
      </div>

      {/* Route Status Summary */}
      <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm">
        <h2 className="text-sm font-bold text-on-surface mb-3">Status Rute</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary.statusCounts || {}).map(([status, count]) => {
            const cfg = STATUS_CONFIG[status] || {};
            return (
              <span
                key={status}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ color: cfg.color, backgroundColor: cfg.bg }}
              >
                {cfg.label}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Stop Status Summary */}
      <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm">
        <h2 className="text-sm font-bold text-on-surface mb-3">Status Pengiriman per Toko</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(summary.stopStatusCounts || {}).map(([status, count]) => {
            const cfg = STOP_STATUS_CONFIG[status] || {};
            return (
              <div key={status} className="text-center p-3 rounded-xl bg-surface-variant/30">
                <div className="text-2xl font-bold" style={{ color: cfg.color }}>{count}</div>
                <div className="text-xs text-on-surface-variant mt-1">{cfg.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Route List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-on-surface">Daftar Rute ({routes.length})</h2>
        {loading && routes.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant text-sm">Memuat data...</div>
        ) : routes.length === 0 ? (
          <div className="text-center py-12 bg-surface border border-border-glass rounded-2xl">
            <LuTruck className="mx-auto text-3xl text-on-surface-variant/50 mb-2" />
            <p className="text-sm text-on-surface-variant">Belum ada rute pengiriman untuk tanggal ini</p>
          </div>
        ) : (
          routes.map((route) => <RouteCard key={route.id} route={route} />)
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg" style={{ backgroundColor: color + '15' }}>
        <Icon className="text-sm" style={{ color }} />
      </div>
      <span className="text-xs text-on-surface-variant font-medium">{label}</span>
    </div>
    <div className="text-2xl font-bold text-on-surface">{value}</div>
  </div>
);

const RouteCard = ({ route }) => {
  const cfg = STATUS_CONFIG[route.status] || {};
  const deliveredCount = route.stops.filter((s) => s.status === 'DELIVERED').length;
  const totalStops = route.stops.length;
  const progress = totalStops > 0 ? Math.round((deliveredCount / totalStops) * 100) : 0;

  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <LuTruck className="text-lg text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">{route.code}</span>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ color: cfg.color, backgroundColor: cfg.bg }}
              >
                {cfg.label}
              </span>
            </div>
            <div className="text-xs text-on-surface-variant mt-0.5">
              {route.vehicle?.name} ({route.vehicle?.code}) • Supir: {route.driver?.name}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-primary">{route.totalCartons}</div>
          <div className="text-[10px] text-on-surface-variant">Karton</div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-on-surface-variant mb-1">
          <span>{deliveredCount}/{totalStops} Toko Terkirim</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#16a34a' : '#2563eb' }}
          />
        </div>
      </div>

      {/* Stop list preview */}
      <div className="space-y-1.5">
        {route.stops.map((stop, idx) => {
          const stopCfg = STOP_STATUS_CONFIG[stop.status] || {};
          return (
            <div key={stop.id || idx} className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg bg-surface-variant/30">
              <span className="w-5 h-5 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-bold text-on-surface-variant shrink-0">
                {idx + 1}
              </span>
              <span className="flex-1 text-on-surface font-medium truncate">{stop.outlet?.name}</span>
              <span className="text-[10px] font-semibold shrink-0" style={{ color: stopCfg.color }}>
                {stopCfg.label}
              </span>
              <span className="text-on-surface-variant shrink-0">{stop.packingList?.totalCartons || 0} krt</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
