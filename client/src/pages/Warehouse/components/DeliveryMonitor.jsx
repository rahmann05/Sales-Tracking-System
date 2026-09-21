import React, { useState, useEffect, useCallback } from 'react';
import { deliveryApi } from '../../../services/api';
import { LuTruck, LuRefreshCw, LuCalendar, LuMapPin, LuClock, LuCircleCheck, LuCircleX } from 'react-icons/lu';
import { FiAlertTriangle } from 'react-icons/fi';

const STATUS_ICON = {
  PENDING: LuClock,
  DELIVERED: LuCircleCheck,
  REJECTED: LuCircleX,
  PARTIAL_REJECT: FiAlertTriangle,
};

const STATUS_COLOR = {
  PENDING: '#6b7280',
  DELIVERED: '#16a34a',
  REJECTED: '#dc2626',
  PARTIAL_REJECT: '#d97706',
};

const STATUS_LABEL = {
  PENDING: 'Menunggu',
  DELIVERED: 'Terkirim',
  REJECTED: 'Ditolak',
  PARTIAL_REJECT: 'Sebagian Ditolak',
};

const ROUTE_STATUS = {
  DRAFT: { label: 'Draft', color: '#6b7280' },
  READY: { label: 'Siap Kirim', color: '#2563eb' },
  IN_TRANSIT: { label: 'Dalam Perjalanan', color: '#d97706' },
  COMPLETED: { label: 'Selesai', color: '#16a34a' },
  PARTIAL: { label: 'Sebagian', color: '#dc2626' },
};

/**
 * DeliveryMonitor — Real-time monitoring of delivery routes and stops for Kepala Gudang.
 */
export const DeliveryMonitor = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expandedRoute, setExpandedRoute] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryApi.getDashboard({ date: selectedDate });
      if (res.success) setDashboard(res.data);
    } catch (err) {
      console.error('Monitor fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const routes = dashboard?.routes || [];
  const activeRoutes = routes.filter((r) => r.status === 'IN_TRANSIT');
  const completedRoutes = routes.filter((r) => r.status === 'COMPLETED' || r.status === 'PARTIAL');
  const pendingRoutes = routes.filter((r) => r.status === 'DRAFT' || r.status === 'READY');

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto pb-16 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <LuTruck className="text-primary" />
            Monitor Pengiriman
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Pantau status pengiriman secara real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-border-glass bg-surface hover:bg-surface-variant transition-colors"
          >
            <LuRefreshCw className={`text-on-surface-variant ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Auto-refresh setiap 30 detik
      </div>

      {/* Active Routes (IN_TRANSIT) */}
      {activeRoutes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Sedang Dalam Perjalanan ({activeRoutes.length})
          </h2>
          {activeRoutes.map((route) => (
            <MonitorRouteCard
              key={route.id}
              route={route}
              expanded={expandedRoute === route.id}
              onToggle={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}
            />
          ))}
        </div>
      )}

      {/* Pending Routes */}
      {pendingRoutes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-on-surface">Belum Berangkat ({pendingRoutes.length})</h2>
          {pendingRoutes.map((route) => (
            <MonitorRouteCard
              key={route.id}
              route={route}
              expanded={expandedRoute === route.id}
              onToggle={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}
            />
          ))}
        </div>
      )}

      {/* Completed Routes */}
      {completedRoutes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-on-surface">Selesai ({completedRoutes.length})</h2>
          {completedRoutes.map((route) => (
            <MonitorRouteCard
              key={route.id}
              route={route}
              expanded={expandedRoute === route.id}
              onToggle={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}
            />
          ))}
        </div>
      )}

      {routes.length === 0 && !loading && (
        <div className="text-center py-12 bg-surface border border-border-glass rounded-2xl">
          <LuTruck className="mx-auto text-3xl text-on-surface-variant/50 mb-2" />
          <p className="text-sm text-on-surface-variant">Tidak ada rute pengiriman untuk tanggal ini</p>
        </div>
      )}
    </div>
  );
};

const MonitorRouteCard = ({ route, expanded, onToggle }) => {
  const statusCfg = ROUTE_STATUS[route.status] || {};
  const deliveredCount = route.stops.filter((s) => s.status === 'DELIVERED').length;
  const totalStops = route.stops.length;
  const progress = totalStops > 0 ? Math.round((deliveredCount / totalStops) * 100) : 0;

  return (
    <div className="bg-surface border border-border-glass rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-variant/30" onClick={onToggle}>
        <div className="p-2 rounded-xl" style={{ backgroundColor: statusCfg.color + '15' }}>
          <LuTruck className="text-lg" style={{ color: statusCfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-on-surface">{route.vehicle?.name}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ color: statusCfg.color, backgroundColor: statusCfg.color + '20' }}>
              {statusCfg.label}
            </span>
          </div>
          <div className="text-xs text-on-surface-variant mt-0.5">
            {route.code} • Supir: {route.driver?.name} • {deliveredCount}/{totalStops} Toko
          </div>
        </div>
        <div className="w-16">
          <div className="text-center text-xs font-bold" style={{ color: progress === 100 ? '#16a34a' : statusCfg.color }}>{progress}%</div>
          <div className="w-full h-1.5 bg-surface-variant rounded-full mt-1 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#16a34a' : statusCfg.color }} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-border-glass pt-3">
          {route.stops.map((stop, idx) => {
            const Icon = STATUS_ICON[stop.status] || LuClock;
            const color = STATUS_COLOR[stop.status] || '#6b7280';
            const label = STATUS_LABEL[stop.status] || '-';
            return (
              <div key={stop.id || idx} className="flex items-center gap-3 text-xs py-2 px-3 rounded-lg bg-surface-variant/30">
                <Icon className="text-base shrink-0" style={{ color }} />
                <span className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-[10px] font-bold text-on-surface-variant shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-on-surface truncate">{stop.outlet?.name}</div>
                </div>
                <span className="text-[10px] font-semibold shrink-0" style={{ color }}>{label}</span>
                <span className="text-on-surface-variant shrink-0">{stop.packingList?.totalCartons || 0} krt</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
