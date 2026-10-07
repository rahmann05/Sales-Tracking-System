import React, { useState } from 'react';
import { vehiclesApi } from '../../../services/api';

// Use fi-icons for missing lu-icons

export const RecordMaintenanceModal = ({
  vehicle,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    serviceType: 'GANTI_OLI',
    cost: 0,
    serviceDate: new Date().toISOString().slice(0, 16)
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        serviceType: formData.serviceType,
        odometerAtService: vehicle.totalKm,
        // Record at current total km
        cost: Number(formData.cost),
        serviceDate: new Date(formData.serviceDate).toISOString()
      };
      const res = await vehiclesApi.recordMaintenance(vehicle.id, payload);
      if (res.success) onSuccess();
    } catch  {
      alert('Gagal mencatat servis');
    } finally {
      setLoading(false);
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-border-glass rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="p-4 border-b border-border-glass">
          <h2 className="text-lg font-bold text-on-surface">Catat Servis</h2>
          <p className="text-sm text-on-surface-variant">{vehicle.name} ({vehicle.code})</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Jenis Servis</label>
            <select value={formData.serviceType} onChange={e => setFormData({
            ...formData,
            serviceType: e.target.value
          })} className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-sm text-on-surface outline-none focus:border-primary/50">
              <option value="GANTI_OLI">Ganti Oli Mesin</option>
              <option value="GANTI_FILTER_OLI">Ganti Filter Oli</option>
              <option value="GANTI_KANVAS_REM">Ganti Kanvas Rem</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Tanggal Servis</label>
            <input type="datetime-local" value={formData.serviceDate} onChange={e => setFormData({
            ...formData,
            serviceDate: e.target.value
          })} required className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-sm text-on-surface outline-none focus:border-primary/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Biaya (Rp)</label>
            <input type="number" min="0" value={formData.cost} onChange={e => setFormData({
            ...formData,
            cost: e.target.value
          })} className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-sm text-on-surface outline-none focus:border-primary/50" />
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
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-variant transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-on-primary hover:brightness-110 transition-all disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>;
};
