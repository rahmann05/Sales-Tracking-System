import { MonitorRouteCard } from "./MonitorRouteCard";
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
import React, { useState, useEffect, useCallback } from 'react';
import { deliveryApi } from '../../../services/api';
import { LuTruck, LuRefreshCw } from "react-icons/lu";
/**
 * DeliveryMonitor — Real-time monitoring of delivery routes and stops for Kepala Gudang.
 */
export const DeliveryMonitor = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => wibDateKey());
  const [expandedRoute, setExpandedRoute] = useState(null);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryApi.getDashboard({
        date: selectedDate
      });
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
  const activeRoutes = routes.filter(r => r.status === 'IN_TRANSIT');
  const completedRoutes = routes.filter(r => r.status === 'COMPLETED' || r.status === 'PARTIAL');
  const pendingRoutes = routes.filter(r => r.status === 'DRAFT' || r.status === 'READY');
  return <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto pb-16 md:pb-8">
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
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-2 rounded-xl border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button onClick={fetchData} className="p-2 rounded-xl border border-border-glass bg-surface hover:bg-surface-variant transition-colors">
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
      {activeRoutes.length > 0 && <div className="space-y-3">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Sedang Dalam Perjalanan ({activeRoutes.length})
          </h2>
          {activeRoutes.map(route => <MonitorRouteCard key={route.id} route={route} onReceived={fetchData} expanded={expandedRoute === route.id} onToggle={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)} />)}
        </div>}

      {/* Pending Routes */}
      {pendingRoutes.length > 0 && <div className="space-y-3">
          <h2 className="text-sm font-bold text-on-surface">Belum Berangkat ({pendingRoutes.length})</h2>
          {pendingRoutes.map(route => <MonitorRouteCard key={route.id} route={route} onReceived={fetchData} expanded={expandedRoute === route.id} onToggle={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)} />)}
        </div>}

      {/* Completed Routes */}
      {completedRoutes.length > 0 && <div className="space-y-3">
          <h2 className="text-sm font-bold text-on-surface">Selesai ({completedRoutes.length})</h2>
          {completedRoutes.map(route => <MonitorRouteCard key={route.id} route={route} onReceived={fetchData} expanded={expandedRoute === route.id} onToggle={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)} />)}
        </div>}

      {routes.length === 0 && !loading && <div className="text-center py-12 bg-surface border border-border-glass rounded-2xl">
          <LuTruck className="mx-auto text-3xl text-on-surface-variant/50 mb-2" />
          <p className="text-sm text-on-surface-variant">Tidak ada rute pengiriman untuk tanggal ini</p>
        </div>}
    </div>;
};
