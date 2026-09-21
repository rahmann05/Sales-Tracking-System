import React, { useState, useEffect } from 'react';
import { vehiclesApi } from '../../../services/api';
import { LuWrench, LuRefreshCw, LuPlus } from 'react-icons/lu';
import { FiCheckCircle, FiAlertTriangle } from 'react-icons/fi'; // Use fi-icons for missing lu-icons

// Thresholds in KM
const THRESHOLDS = {
  GANTI_OLI: 5000,
  GANTI_FILTER_OLI: 10000,
  GANTI_KANVAS_REM: 20000,
};

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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-16 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <LuWrench className="text-primary" />
            Pemeliharaan Kendaraan
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Pantau status kilometer dan jadwal servis armada</p>
        </div>
        <button
          onClick={fetchVehicles}
          className="p-2 rounded-xl border border-border-glass bg-surface hover:bg-surface-variant transition-colors"
          title="Refresh"
        >
          <LuRefreshCw className={`text-on-surface-variant ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* List */}
      {loading && vehicles.length === 0 ? (
        <div className="text-center py-12 text-on-surface-variant text-sm">Memuat data...</div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-12 bg-surface border border-border-glass rounded-2xl">
          <p className="text-sm text-on-surface-variant">Belum ada data kendaraan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vehicles.map((v) => (
            <VehicleMaintenanceCard key={v.id} vehicle={v} onRecord={() => setSelectedVehicle(v)} />
          ))}
        </div>
      )}

      {selectedVehicle && (
        <RecordMaintenanceModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onSuccess={() => {
            setSelectedVehicle(null);
            fetchVehicles();
          }}
        />
      )}
    </div>
  );
};

const VehicleMaintenanceCard = ({ vehicle, onRecord }) => {
  const { totalKm, lastOilChangeKm, lastOilFilterChangeKm, lastBrakePadChangeKm, maxCartons, maxWeightKg } = vehicle;

  return (
    <div className="bg-surface border border-border-glass rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
      {/* Photo Section */}
      <div className="w-full md:w-1/3 bg-surface-variant flex items-center justify-center p-6 relative">
        {vehicle.photoUrl ? (
          <img src={vehicle.photoUrl} alt={vehicle.name} className="w-full h-full object-cover absolute inset-0" />
        ) : (
          <div className="text-center text-on-surface-variant opacity-50 flex flex-col items-center">
            <LuWrench className="text-4xl mb-2" />
            <span className="text-xs font-semibold">Belum Ada Foto</span>
          </div>
        )}
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
          <MaintenanceBar
            label="Oli Mesin"
            currentKm={totalKm}
            lastChangeKm={lastOilChangeKm}
            threshold={THRESHOLDS.GANTI_OLI}
          />
          <MaintenanceBar
            label="Filter Oli"
            currentKm={totalKm}
            lastChangeKm={lastOilFilterChangeKm}
            threshold={THRESHOLDS.GANTI_FILTER_OLI}
          />
          <MaintenanceBar
            label="Kanvas Rem"
            currentKm={totalKm}
            lastChangeKm={lastBrakePadChangeKm}
            threshold={THRESHOLDS.GANTI_KANVAS_REM}
          />
        </div>

        <div className="pt-3 border-t border-border-glass mt-auto">
          <button
            onClick={onRecord}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-sm transition-colors"
          >
            <LuPlus /> Catat Servis
          </button>
        </div>
      </div>
    </div>
  );
};

const MaintenanceBar = ({ label, currentKm, lastChangeKm, threshold }) => {
  const used = Math.max(0, currentKm - (lastChangeKm || 0));
  const percentage = Math.min(100, (used / threshold) * 100);
  const remaining = Math.max(0, threshold - used);

  let colorClass = 'bg-primary';
  let alert = false;
  if (percentage >= 100) {
    colorClass = 'bg-error';
    alert = true;
  } else if (percentage >= 80) {
    colorClass = 'bg-warning';
  }

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-on-surface flex items-center gap-1">
          {label}
          {alert && <FiAlertTriangle className="text-error" />}
        </span>
        <span className="text-on-surface-variant">
          {Math.round(used).toLocaleString('id-ID')} / {threshold.toLocaleString('id-ID')} km
        </span>
      </div>
      <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-[10px] text-right mt-1 text-on-surface-variant">
        {alert ? 'Waktunya ganti!' : `Sisa ${Math.round(remaining).toLocaleString('id-ID')} km`}
      </div>
    </div>
  );
};

const RecordMaintenanceModal = ({ vehicle, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    serviceType: 'GANTI_OLI',
    cost: 0,
    serviceDate: new Date().toISOString().slice(0, 16),
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        serviceType: formData.serviceType,
        odometerAtService: vehicle.totalKm, // Record at current total km
        cost: Number(formData.cost),
        serviceDate: new Date(formData.serviceDate).toISOString(),
      };
      const res = await vehiclesApi.recordMaintenance(vehicle.id, payload);
      if (res.success) onSuccess();
    } catch (err) {
      alert('Gagal mencatat servis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-border-glass rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="p-4 border-b border-border-glass">
          <h2 className="text-lg font-bold text-on-surface">Catat Servis</h2>
          <p className="text-sm text-on-surface-variant">{vehicle.name} ({vehicle.code})</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Jenis Servis</label>
            <select
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-sm text-on-surface outline-none focus:border-primary/50"
            >
              <option value="GANTI_OLI">Ganti Oli Mesin</option>
              <option value="GANTI_FILTER_OLI">Ganti Filter Oli</option>
              <option value="GANTI_KANVAS_REM">Ganti Kanvas Rem</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Tanggal Servis</label>
            <input
              type="datetime-local"
              value={formData.serviceDate}
              onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
              required
              className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-sm text-on-surface outline-none focus:border-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Biaya (Rp)</label>
            <input
              type="number"
              min="0"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-sm text-on-surface outline-none focus:border-primary/50"
            />
          </div>

          <div className="p-3 bg-primary/10 rounded-xl">
            <div className="text-xs text-on-surface-variant text-center">
              Kilometer saat ini: <span className="font-bold text-primary">{Math.round(vehicle.totalKm).toLocaleString('id-ID')} km</span>
            </div>
            <div className="text-[10px] text-center mt-1 text-on-surface-variant opacity-80">
              Jarak komponen akan otomatis di-reset dari kilometer ini
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-glass">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-variant transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-on-primary hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
