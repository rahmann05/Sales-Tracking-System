import React, { useState } from 'react';
import { WarehouseDashboard } from './components/WarehouseDashboard';
import { VehicleMaintenanceDashboard } from './components/VehicleMaintenanceDashboard';
import { LuTruck, LuWrench } from 'react-icons/lu'; // Fixed icons (from lu instead of fi/fa)

/**
 * WarehousePage — Main workspace for Kepala Gudang role.
 * Tabs: Pengiriman, Kendaraan
 */
export const WarehousePage = () => {
  const [activeTab, setActiveTab] = useState('pengiriman');

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Tabs Header */}
      <div className="flex items-center gap-4 px-4 pt-4 border-b border-border-glass overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('pengiriman')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'pengiriman'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <LuTruck /> Pengiriman
        </button>
        <button
          onClick={() => setActiveTab('kendaraan')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'kendaraan'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <LuWrench /> Kendaraan & Servis
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'pengiriman' && <WarehouseDashboard />}
        {activeTab === 'kendaraan' && <VehicleMaintenanceDashboard />}
      </div>
    </div>
  );
};
