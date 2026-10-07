import { useApp } from '../../../context/AppContext';
import React from 'react';
import { LuWrench, LuPlus } from 'react-icons/lu';
// Use fi-icons for missing lu-icons
import { MaintenanceBar } from "./MaintenanceBar";
export const VehicleMaintenanceCard = ({
  vehicle,
  onRecord
}) => {
  const {
    settings
  } = useApp();
  const {
    totalKm,
    lastOilChangeKm,
    lastOilFilterChangeKm,
    lastBrakePadChangeKm,
    maxCartons,
    maxWeightKg
  } = vehicle;
  return <div className="bg-surface border border-border-glass rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
      {/* Photo Section */}
      <div className="w-full md:w-1/3 bg-surface-variant flex items-center justify-center p-6 relative">
        {vehicle.photoUrl ? <img src={vehicle.photoUrl} alt={vehicle.name} className="w-full h-full object-cover absolute inset-0" /> : <div className="text-center text-on-surface-variant opacity-50 flex flex-col items-center">
            <LuWrench className="text-4xl mb-2" />
            <span className="text-xs font-semibold">Belum Ada Foto</span>
          </div>}
      </div>

      {/* Details Section */}
      <div className="flex-1 p-5 flex flex-col space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-on-surface">{vehicle.name}</h3>
            <p className="text-sm font-medium text-on-surface-variant">{vehicle.code} • {vehicle.fuelType}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-primary">{Math.round(totalKm).toLocaleString('id-ID')}</div>
            <div className="text-xs text-on-surface-variant">Total KM</div>
          </div>
        </div>

        {/* Specifications */}
        <div className="flex gap-4 p-3 bg-surface-variant/30 rounded-xl">
          <div>
            <div className="text-xs text-on-surface-variant">Kapasitas Maksimal</div>
            <div className="text-sm font-bold text-on-surface">{maxCartons} Karton</div>
          </div>
          <div className="border-l border-border-glass pl-4">
            <div className="text-xs text-on-surface-variant">Berat Maksimal</div>
            <div className="text-sm font-bold text-on-surface">{maxWeightKg} kg</div>
          </div>
        </div>

        {/* Maintenance Bars */}
        <div className="space-y-3 pt-2 flex-1">
          <MaintenanceBar label="Oli Mesin" currentKm={totalKm} lastChangeKm={lastOilChangeKm} threshold={settings.OIL_CHANGE_INTERVAL_KM} />
          <MaintenanceBar label="Filter Oli" currentKm={totalKm} lastChangeKm={lastOilFilterChangeKm} threshold={settings.OIL_FILTER_CHANGE_INTERVAL_KM} />
          <MaintenanceBar label="Kanvas Rem" currentKm={totalKm} lastChangeKm={lastBrakePadChangeKm} threshold={settings.BRAKE_CHANGE_INTERVAL_KM} />
        </div>

        <div className="pt-3 border-t border-border-glass mt-auto">
          <button onClick={onRecord} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-sm transition-colors">
            <LuPlus /> Catat Servis
          </button>
        </div>
      </div>
    </div>;
};
