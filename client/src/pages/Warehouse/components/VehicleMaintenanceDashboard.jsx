import { VehicleMaintenanceCard } from "./VehicleMaintenanceCard";
import { RecordMaintenanceModal } from "./RecordMaintenanceModal";
import React, { useState, useEffect } from 'react';
import { vehiclesApi } from '../../../services/api';
import { LuWrench, LuRefreshCw } from 'react-icons/lu';
// Use fi-icons for missing lu-icons

export const VehicleMaintenanceDashboard = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await vehiclesApi.getAll();
      if (res.status === 'success' || res.data) setVehicles(res.data || res);
    } catch (err) {
      console.error('Failed to fetch vehicles', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchVehicles();
  }, []);
  return <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-16 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <LuWrench className="text-primary" />
            Pemeliharaan Kendaraan
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Pantau status kilometer dan jadwal servis armada</p>
        </div>
        <button onClick={fetchVehicles} className="p-2 rounded-xl border border-border-glass bg-surface hover:bg-surface-variant transition-colors" title="Refresh">
          <LuRefreshCw className={`text-on-surface-variant ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* List */}
      {loading && vehicles.length === 0 ? <div className="text-center py-12 text-on-surface-variant text-sm">Memuat data...</div> : vehicles.length === 0 ? <div className="text-center py-12 bg-surface border border-border-glass rounded-2xl">
          <p className="text-sm text-on-surface-variant">Belum ada data kendaraan</p>
        </div> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vehicles.map(v => <VehicleMaintenanceCard key={v.id} vehicle={v} onRecord={() => setSelectedVehicle(v)} />)}
        </div>}

      {selectedVehicle && <RecordMaintenanceModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} onSuccess={() => {
      setSelectedVehicle(null);
      fetchVehicles();
    }} />}
    </div>;
};
