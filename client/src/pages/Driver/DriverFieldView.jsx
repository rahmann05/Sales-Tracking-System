import React, { useState, useEffect, useCallback } from 'react';
import { deliveryApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { DriverStopCard } from './components/DriverStopCard';
import { DriverAttendanceModal } from './components/DriverAttendanceModal';
import { LuTruck, LuMapPin, LuPackage, LuCalendar, LuRefreshCw, LuCircleCheck } from 'react-icons/lu';

/**
 * DriverFieldView — The Supir's main workspace (similar to SalesFieldView).
 * Shows today's assigned delivery route with stops, attendance buttons, and status tracking.
 */
export const DriverFieldView = () => {
  const { user } = useApp();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState(null); // { stop, type: 'attendance' | 'status' }

  const today = new Date().toISOString().slice(0, 10);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryApi.getDeliveryRoutes({ date: today });
      if (res.success) setRoutes(res.data.items || []);
    } catch (err) {
      console.error('Error fetching driver routes:', err);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  // Active route (first IN_TRANSIT or READY)
  const activeRoute = routes.find((r) => r.status === 'IN_TRANSIT') || routes.find((r) => r.status === 'READY') || routes[0];
  const stops = activeRoute?.stops || [];

  // Stats
  const totalStops = stops.length;
  const deliveredCount = stops.filter((s) => s.status === 'DELIVERED').length;
  const pendingCount = stops.filter((s) => s.status === 'PENDING').length;
  const rejectedCount = stops.filter((s) => s.status === 'REJECTED' || s.status === 'PARTIAL_REJECT').length;
  const totalCartons = activeRoute?.totalCartons || 0;

  const handleAttendance = async (stopId, data) => {
    try {
      await deliveryApi.submitDriverAttendance(stopId, data);
      setModalData(null);
      fetchRoutes();
    } catch (err) {
      alert(err.message || 'Gagal mencatat absensi');
    }
  };

  const handleStatusUpdate = async (stopId, data) => {
    try {
      await deliveryApi.updateStopStatus(stopId, data);
      setModalData(null);
      fetchRoutes();
    } catch (err) {
      alert(err.message || 'Gagal update status');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto pb-16 md:pb-8">
      {/* Header */}
      <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <LuTruck className="text-2xl text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-on-surface">Rute Pengiriman Hari Ini</h1>
            <div className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-2">
              <LuCalendar className="text-xs" />
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <button onClick={fetchRoutes} className="p-2 rounded-xl border border-border-glass hover:bg-surface-variant transition-colors">
            <LuRefreshCw className={`text-on-surface-variant ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Route Info */}
        {activeRoute && (
          <div className="mt-3 pt-3 border-t border-border-glass flex items-center gap-3 flex-wrap text-xs">
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">{activeRoute.code}</span>
            <span className="text-on-surface-variant">
              <LuTruck className="inline mr-1" />
              {activeRoute.vehicle?.name} ({activeRoute.vehicle?.code})
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                color: activeRoute.status === 'IN_TRANSIT' ? '#d97706' : activeRoute.status === 'COMPLETED' ? '#16a34a' : '#2563eb',
                backgroundColor: activeRoute.status === 'IN_TRANSIT' ? '#fef3c7' : activeRoute.status === 'COMPLETED' ? '#dcfce7' : '#dbeafe',
              }}
            >
              {activeRoute.status === 'READY' ? 'Siap Kirim' : activeRoute.status === 'IN_TRANSIT' ? 'Dalam Perjalanan' : activeRoute.status === 'COMPLETED' ? 'Selesai' : activeRoute.status}
            </span>
          </div>
        )}
      </div>

      {/* Progress Summary */}
      {activeRoute && (
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Total Toko" value={totalStops} icon={LuMapPin} color="#2563eb" />
          <MetricCard label="Terkirim" value={deliveredCount} icon={LuCircleCheck} color="#16a34a" />
          <MetricCard label="Menunggu" value={pendingCount} icon={LuTruck} color="#d97706" />
          <MetricCard label="Total Karton" value={totalCartons} icon={LuPackage} color="#7c3aed" />
        </div>
      )}

      {/* Progress Bar */}
      {activeRoute && totalStops > 0 && (
        <div className="bg-surface border border-border-glass rounded-2xl p-3 shadow-sm">
          <div className="flex justify-between text-xs text-on-surface-variant mb-2">
            <span>Progress Pengiriman</span>
            <span className="font-bold text-on-surface">{Math.round((deliveredCount / totalStops) * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(deliveredCount / totalStops) * 100}%`,
                backgroundColor: deliveredCount === totalStops ? '#16a34a' : '#2563eb',
              }}
            />
          </div>
        </div>
      )}

      {/* Stop Cards */}
      {loading ? (
        <div className="text-center py-12 text-on-surface-variant text-sm">Memuat rute...</div>
      ) : !activeRoute ? (
        <div className="text-center py-16 bg-surface border border-border-glass rounded-2xl">
          <LuTruck className="mx-auto text-4xl text-on-surface-variant/50 mb-3" />
          <p className="text-sm font-semibold text-on-surface mb-1">Belum Ada Rute Hari Ini</p>
          <p className="text-xs text-on-surface-variant">Hubungi Kepala Gudang untuk mendapatkan rute pengiriman</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stops.map((stop, idx) => (
            <DriverStopCard
              key={stop.id}
              stop={stop}
              index={idx}
              totalStops={totalStops}
              onAbsenIn={() => setModalData({ stop, type: 'absen_in' })}
              onMarkDelivered={() => setModalData({ stop, type: 'delivered' })}
              onMarkRejected={() => setModalData({ stop, type: 'rejected' })}
            />
          ))}
        </div>
      )}

      {/* Attendance Modal */}
      {modalData && (
        <DriverAttendanceModal
          stop={modalData.stop}
          type={modalData.type}
          onClose={() => setModalData(null)}
          onSubmitAttendance={handleAttendance}
          onSubmitStatus={handleStatusUpdate}
        />
      )}
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-surface border border-border-glass rounded-xl p-3 shadow-sm text-center">
    <Icon className="mx-auto text-lg mb-1" style={{ color }} />
    <div className="text-xl font-bold text-on-surface">{value}</div>
    <div className="text-[10px] text-on-surface-variant">{label}</div>
  </div>
);
