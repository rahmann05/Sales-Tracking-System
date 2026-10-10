import {GuardedDialog} from '../../../shared/components/common/GuardedDialog';
import React, { useState } from 'react';
import { vehiclesApi } from '../../../services/api';
import {useApp} from '../../../context/AppContext';
import {serviceCatalog} from '../../../../../shared/reference-catalog.mjs';

// Use fi-icons for missing lu-icons

export const RecordMaintenanceModal = ({
  vehicle,
  onClose,
  onSuccess
}) => {
  const {settings}=useApp();
  const serviceOptions=serviceCatalog(settings).filter(r=>r.active);
  const [requestId]=useState(()=>crypto.randomUUID());
  const todayWib=new Date(Date.now()+7*3600000).toISOString().slice(0,10);
  const earliest=settings.VEHICLE_SERVICE_ALLOW_BACKDATE===false?todayWib:settings.VEHICLE_SERVICE_MAX_BACKDATE_DAYS>0?new Date(Date.now()+7*3600000-settings.VEHICLE_SERVICE_MAX_BACKDATE_DAYS*86400000).toISOString().slice(0,10):null;
  const [formData, setFormData] = useState({
    serviceType: serviceOptions[0]?.code||'',
    cost: 0,
    serviceDate: new Date(Date.now()+7*3600000).toISOString().slice(0,16),
    odometerAtService:vehicle.totalKm,workshopName:'',notes:''
  });
  const [loading, setLoading] = useState(false);
  const [dirty,setDirty]=useState(false),[error,setError]=useState('');
  const change=value=>{setDirty(true);setFormData(value);};
  const handleSubmit = async e => {
    e.preventDefault();
    if(loading)return;
    setError('');setLoading(true);
    try {
      if(!serviceOptions.some(r=>r.code===formData.serviceType))throw new Error('Jenis servis tidak tersedia. Pilih ulang jenis servis.');
      const payload = {
        requestId,
        serviceType: formData.serviceType,
        odometerAtService: Number(formData.odometerAtService),
        workshopName:formData.workshopName,notes:formData.notes,
        // Use the actual odometer entered for this service.
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
          <label className="block">Bengkel {settings.VEHICLE_SERVICE_REQUIRE_WORKSHOP?'(wajib)':'(opsional)'}<input required={settings.VEHICLE_SERVICE_REQUIRE_WORKSHOP===true} maxLength={200} className="form-input block w-full" value={formData.workshopName} onChange={e=>change({...formData,workshopName:e.target.value})}/></label>
          <label className="block">Catatan servis {settings.VEHICLE_SERVICE_REQUIRE_NOTE?'(wajib)':'(opsional)'}<textarea required={settings.VEHICLE_SERVICE_REQUIRE_NOTE===true} maxLength={2000} className="form-input block w-full" value={formData.notes} onChange={e=>change({...formData,notes:e.target.value})}/></label>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Jenis Servis</label>
            <select value={formData.serviceType} onChange={e => change({
            ...formData,
            serviceType: e.target.value
          })} className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-sm text-on-surface outline-none focus:border-primary/50">
              {!serviceOptions.some(r=>r.code===formData.serviceType)&&<option value="">Pilih ulang jenis servis</option>}
              {serviceOptions.map(r=><option key={r.code} value={r.code}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Tanggal Servis</label>
            <input type="datetime-local" min={earliest?`${earliest}T00:00`:undefined} max={`${todayWib}T23:59`} value={formData.serviceDate} onChange={e => change({
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
