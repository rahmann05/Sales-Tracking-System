import { ShiftAttendanceWidget } from '../../shared/components/common/ShiftAttendanceWidget';
import { StaffAttendanceReport } from '../../shared/components/common/StaffAttendanceReport';
import React, { useState, Suspense, lazy } from 'react';
import { WarehouseDashboard } from './components/WarehouseDashboard';
import { LuTruck, LuWrench } from 'react-icons/lu';

// Lazy-loaded: hanya dimuat saat tab Kendaraan dibuka (~11 KB terhindar dari chunk utama)
const VehicleMaintenanceDashboard = lazy(() =>
  import('./components/VehicleMaintenanceDashboard').then(m => ({ default: m.VehicleMaintenanceDashboard }))
);

/**
 * WarehousePage — Main workspace for Kepala Gudang role.
 * Tabs: Pengiriman, Kendaraan
 */
export const WarehousePage = () => {
  const [activeTab, setActiveTab] = useState('pengiriman');

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-4"><ShiftAttendanceWidget /></div>
      {/* Tabs Header */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-4 border-b border-border-glass w-full">
        <button
          onClick={() => setActiveTab('pengiriman')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-colors text-center w-full ${
            activeTab === 'pengiriman'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <LuTruck /> Pengiriman
        </button>
        <button
          onClick={() => setActiveTab('kendaraan')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-colors text-center w-full ${
            activeTab === 'kendaraan'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <LuWrench /> Kendaraan & Servis
        </button>
        <button className="p-3 text-sm font-medium" onClick={() => setActiveTab('absensi')}>Riwayat absensi</button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'pengiriman' && <WarehouseDashboard />}
        {activeTab === 'absensi' && <StaffAttendanceReport />}
        {activeTab === 'kendaraan' && (
          <Suspense fallback={<div className="flex items-center justify-center py-16 text-sm text-on-surface-variant">Memuat modul kendaraan...</div>}>
            <VehicleMaintenanceDashboard />
          </Suspense>
        )}

      </div>
    </div>
  );
};
