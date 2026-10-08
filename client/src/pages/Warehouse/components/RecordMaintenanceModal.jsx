import {GuardedDialog} from '../../../shared/components/common/GuardedDialog';
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
    serviceDate: new Date(Date.now()+7*3600000).toISOString().slice(0,16),
    odometerAtService:vehicle.totalKm,workshopName:'',notes:''
  });
  const [loading, setLoading] = useState(false);
  const [dirty,setDirty]=useState(false),[error,setError]=useState('');
  const change=value=>{setDirty(true);setFormData(value);};
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        serviceType: formData.serviceType,
        odometerAtService: Number(formData.odometerAtService),
        workshopName:formData.workshopName,notes:formData.notes,
        // Record at current total km
        cost: Number(formData.cost),
        serviceDate: new Date(`${formData.serviceDate}:00+07:00`).toISOString()
      };
      const res = await vehiclesApi.recordMaintenance(vehicle.id, payload);
      if (res.status==='success' || res.success) onSuccess();
    } catch (e) {
      setError(e.message||'Gagal mencatat servis');
    } finally {
      setLoading(false);
    }
  };
  return <GuardedDialog open title="Catat servis kendaraan" onClose={onClose} busy={loading} dirty={dirty} className="logistics-dialog"><p className="px-5 pt-4">{vehicle.name} · {vehicle.code}</p>
        <form onSubmit={handleSubmit} className="p-5 space-y-4"><fieldset disabled={loading} className="space-y-4">{error&&<p role="alert" className="app-error">{error}</p>}
          <label className="block">Odometer aktual saat servis (km)<input required type="number" min="0" step="0.1" className="form-input block w-full" value={formData.odometerAtService} onChange={e=>change({...formData,odometerAtService:e.target.value})}/></label>
          <label className="block">Bengkel<input maxLength={200} className="form-input block w-full" value={formData.workshopName} onChange={e=>change({...formData,workshopName:e.target.value})}/></label>
          <label className="block">Catatan servis<textarea maxLength={2000} className="form-input block w-full" value={formData.notes} onChange={e=>change({...formData,notes:e.target.value})}/></label>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Jenis Servis</label>
            <select value={formData.serviceType} onChange={e => change({
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
            <input type="datetime-local" value={formData.serviceDate} onChange={e => change({
            ...formData,
            serviceDate: e.target.value
          })} required className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-sm text-on-surface outline-none focus:border-primary/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Biaya (Rp)</label>
            <input type="number" min="0" value={formData.cost} onChange={e => change({
            ...formData,
            cost: e.target.value
          })} className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-sm text-on-surface outline-none focus:border-primary/50" />
          </div>

          <div className="p-3 bg-primary/10 rounded-xl">
            <div className="text-xs text-on-surface-variant text-center">
              Kilometer saat ini: <span className="font-bold text-primary">{Math.round(vehicle.totalKm).toLocaleString('id-ID')} km</span>
            </div>
            <div className="text-[10px] text-center mt-1 text-on-surface-variant opacity-80">
              Jarak komponen dihitung dari odometer aktual saat servis yang Anda input.
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-glass">
            <button type="button" onClick={()=>{if(!dirty||window.confirm('Isian belum disimpan. Tutup formulir servis?'))onClose();}} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-variant transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-on-primary hover:brightness-110 transition-all disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </fieldset></form>
    </GuardedDialog>;
};
