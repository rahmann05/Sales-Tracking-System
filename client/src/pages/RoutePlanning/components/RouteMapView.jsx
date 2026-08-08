import React, { useState, useMemo } from 'react';
import { LuNavigation } from 'react-icons/lu';
import { GoogleClusterRouteMap } from '../../Dashboard/components/GoogleClusterRouteMap';
import { useApp } from '../../../context/AppContext';

/**
 * RouteMapView Component
 * Single Responsibility: Interactive Google Map displaying all sales/team outlet markers and routes.
 * 1 File per Component
 */
export const RouteMapView = () => {
  const { salesStops = [], user } = useApp();
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Role check: Only Supervisor, Operational Manager, and Admin can see options to switch to other teams / clusters / all teams
  const isSupervisorOrManager = ['SUPERVISOR', 'OPERATIONAL_MANAGER', 'ADMIN'].includes(user?.role);
  const isSalesRole = user?.role === 'SALES';

  // Team/Sales filter options (only accessible to Supervisor & Manager)
  const filterOptions = [
    { id: 'ALL', name: 'Semua Tim (30 Outlet)', salesName: null },
    { id: 'sales-1', name: 'Tim Cimahi - Budi Santoso', salesName: 'Budi Santoso' },
    { id: 'sales-2', name: 'Tim Padalarang - Siti Rahma', salesName: 'Siti Rahma' },
    { id: 'sales-3', name: 'Tim Lembang - Agus Wijaya', salesName: 'Agus Wijaya' },
  ];

  const currentOption = useMemo(() => {
    return filterOptions.find((f) => f.id === selectedFilter) || filterOptions[0];
  }, [selectedFilter]);

  // Selected Sales object for GoogleClusterRouteMap
  const selectedSalesObj = useMemo(() => {
    if (!isSupervisorOrManager || selectedFilter === 'ALL') return null;
    const filteredStops = salesStops.filter((s) => s.assignedSalesName === currentOption.salesName);
    return {
      id: selectedFilter,
      name: currentOption.salesName,
      stops: filteredStops,
    };
  }, [isSupervisorOrManager, selectedFilter, salesStops, currentOption]);

  const activeStops = useMemo(() => {
    if (isSalesRole) {
      return salesStops.filter((s) => !s.assignedSalesName || s.assignedSalesName === user?.name || s.assignedSalesName === 'Budi Santoso');
    }
    if (selectedFilter === 'ALL') return salesStops;
    return salesStops.filter((s) => s.assignedSalesName === currentOption.salesName);
  }, [salesStops, selectedFilter, currentOption, isSalesRole, user]);

  return (
    <div className="bg-surface border border-border-glass rounded-2xl overflow-hidden shadow-md">
      {/* Map Header Overlay */}
      <div className="p-4 bg-surface-container-low border-b border-border-glass flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0">
            <LuNavigation />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-on-surface">
              {isSalesRole ? 'Peta Spasial Rute & Titik Outlet Kunjungan Anda' : 'Peta Spasial Rute & Titik Outlet Tim Sales'}
            </h3>
            <p className="text-xs text-on-surface-variant">
              {isSalesRole
                ? `Menampilkan ${activeStops.length} titik outlet aktif pada rute RJP klaster Anda`
                : `Menampilkan ${activeStops.length} titik outlet aktif di wilayah Region Cimahi - Bandung Barat`}
            </p>
          </div>
        </div>

        {/* Team/Sales Filter Pills (Restricted to Supervisor & Operational Manager) */}
        {isSupervisorOrManager && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {filterOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedFilter(opt.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  selectedFilter === opt.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {opt.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Real Interactive Google Maps Container */}
      <div className="w-full h-[540px] md:h-[600px] relative">
        <GoogleClusterRouteMap
          allStops={activeStops}
          selectedSales={selectedSalesObj}
          userRole={user?.role || 'SUPERVISOR'}
        />
      </div>
    </div>
  );
};
