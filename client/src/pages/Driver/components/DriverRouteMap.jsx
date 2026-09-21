import React, { useState, useEffect, useCallback } from 'react';
import { deliveryApi } from '../../../services/api';
import { LuMapPin, LuTruck, LuNavigation, LuCircleCheck, LuClock, LuCircleX } from 'react-icons/lu';

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

/**
 * DriverRouteMap — Map view of today's delivery route for Supir.
 * Shows list of stops with navigation links (Google Maps directions).
 */
export const DriverRouteMap = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryApi.getDeliveryRoutes({ date: today });
      if (res.success) setRoutes(res.data.items || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const activeRoute = routes.find((r) => r.status === 'IN_TRANSIT') || routes.find((r) => r.status === 'READY') || routes[0];
  const stops = activeRoute?.stops || [];

  // Build Google Maps multi-stop navigation URL
  const buildRouteUrl = () => {
    if (stops.length === 0) return '#';
    const validStops = stops.filter((s) => s.outlet?.latitude && s.outlet?.longitude);
    if (validStops.length === 0) return '#';

    const destination = validStops[validStops.length - 1];
    const waypoints = validStops.slice(0, -1).map((s) => `${s.outlet.latitude},${s.outlet.longitude}`).join('|');

    let url = `https://www.google.com/maps/dir/?api=1&destination=${destination.outlet.latitude},${destination.outlet.longitude}`;
    if (waypoints) url += `&waypoints=${waypoints}`;
    url += '&travelmode=driving';
    return url;
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto pb-16 md:pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
          <LuMapPin className="text-primary" />
          Peta Pengiriman
        </h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant text-sm">Memuat...</div>
      ) : !activeRoute ? (
        <div className="text-center py-16 bg-surface border border-border-glass rounded-2xl">
          <LuTruck className="mx-auto text-3xl text-on-surface-variant/50 mb-2" />
          <p className="text-sm text-on-surface-variant">Belum ada rute hari ini</p>
        </div>
      ) : (
        <>
          {/* Navigate All button */}
          <a
            href={buildRouteUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
          >
            <LuNavigation /> Buka Rute di Google Maps
          </a>

          {/* Stop list with map links */}
          <div className="space-y-2">
            {stops.map((stop, idx) => {
              const color = STATUS_COLOR[stop.status] || '#6b7280';
              const label = STATUS_LABEL[stop.status] || '-';
              const hasCoords = stop.outlet?.latitude && stop.outlet?.longitude;

              return (
                <div key={stop.id || idx} className="bg-surface border border-border-glass rounded-xl p-3 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: color + '20', color }}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-on-surface truncate">{stop.outlet?.name}</div>
                    <div className="text-xs text-on-surface-variant truncate">{stop.outlet?.address}</div>
                    <div className="text-[10px] font-semibold mt-0.5" style={{ color }}>{label}</div>
                  </div>
                  {hasCoords && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${stop.outlet.latitude},${stop.outlet.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-primary/20 text-primary hover:bg-primary/5 shrink-0"
                      title="Navigasi"
                    >
                      <LuNavigation className="text-sm" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
