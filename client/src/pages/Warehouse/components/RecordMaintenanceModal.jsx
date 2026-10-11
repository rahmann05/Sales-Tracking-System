import {GuardedDialog} from '../../../shared/components/common/GuardedDialog';
import React, { useState } from 'react';
import { LuCheck, LuExternalLink } from 'react-icons/lu';
import { vehiclesApi } from '../../../services/api';
import {useApp} from '../../../context/AppContext';
import {serviceCatalog} from '../../../../../shared/reference-catalog.mjs';
import {parseGoogleMapsPoint, googleMapsPointUrl} from '../../../../../shared/google-maps-point.mjs';
import {DeviceCameraCapture} from '../../../shared/components/camera/DeviceCameraCapture';

export const RecordMaintenanceModal = ({
  vehicle,
  onClose,
  onSuccess
}) => {
  const {settings, user}=useApp();
  const isAdmin = user?.role === 'ADMIN';
  const serviceOptions=serviceCatalog(settings).filter(r=>r.active);
  const [requestId]=useState(()=>crypto.randomUUID());
  const todayWib=new Date(Date.now()+7*3600000).toISOString().slice(0,10);
  const earliest=settings.VEHICLE_SERVICE_ALLOW_BACKDATE===false?todayWib:settings.VEHICLE_SERVICE_MAX_BACKDATE_DAYS>0?new Date(Date.now()+7*3600000-settings.VEHICLE_SERVICE_MAX_BACKDATE_DAYS*86400000).toISOString().slice(0,10):null;
  const [formData, setFormData] = useState({
    serviceTypes: serviceOptions[0]?.code ? [serviceOptions[0].code] : [],
    cost: 0,
    serviceDate: new Date(Date.now()+7*3600000).toISOString().slice(0,16),
    odometerAtService:vehicle.totalKm,workshopName:'',notes:'',
    mapsInput: ''
  });
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [serviceGps, setServiceGps] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dirty,setDirty]=useState(false),[error,setError]=useState('');
  const change=value=>{setDirty(true);setFormData(value);};
  const toggleServiceType = (code) => {
    setDirty(true);
    setFormData(prev => {
      const exists = prev.serviceTypes.includes(code);
      const next = exists ? prev.serviceTypes.filter(c => c !== code) : [...prev.serviceTypes, code];
      return { ...prev, serviceTypes: next };
    });
  };
  const parsedAdminPoint = isAdmin ? parseGoogleMapsPoint(formData.mapsInput) : null;

  const handleSubmit = async e => {
    e.preventDefault();
    if(loading)return;
    setError('');setLoading(true);
    try {
      const selectedCodes = (formData.serviceTypes || []).filter(code => serviceOptions.some(r => r.code === code));
      if (!selectedCodes.length) throw new Error('Pilih minimal satu jenis servis pada daftar ceklis.');
      if (!receiptPhoto) throw new Error('Foto struk servis wajib diunggah.');
      let locationPayload;
      if (isAdmin) {
        if (!parsedAdminPoint) {
          throw new Error('Titik bengkel Google Maps wajib diisi (tempel tautan Google Maps atau koordinat lat, lng).');
        }
        locationPayload = {
          latitude: parsedAdminPoint.latitude,
          longitude: parsedAdminPoint.longitude,
          mapsUrl: formData.mapsInput.trim() || parsedAdminPoint.mapsUrl
        };
      } else {
        if (!serviceGps || !Number.isFinite(serviceGps.lat) || !Number.isFinite(serviceGps.lng)) {
          throw new Error('Titik absen servis wajib menggunakan GPS perangkat aktif saat servis dilakukan.');
        }
        locationPayload = {
          latitude: serviceGps.lat,
          longitude: serviceGps.lng,
          accuracy: serviceGps.accuracy,
          observedAt: serviceGps.observedAt || new Date().toISOString()
        };
      }
      const payload = {
        requestId,
        serviceType: selectedCodes[0],
        serviceTypes: selectedCodes,
        odometerAtService: Number(formData.odometerAtService),
        workshopName:formData.workshopName,notes:formData.notes,
        cost: Number(formData.cost),
        serviceDate: new Date(`${formData.serviceDate}:00+07:00`).toISOString(),
        receiptPhotoUrl: receiptPhoto,
        location: locationPayload
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
          <div>
            <span className="block text-xs font-semibold text-on-surface-variant mb-2">Jenis Servis (ceklis satu atau lebih)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-label="Pilih jenis servis">
              {serviceOptions.map(r => {
                const checked = formData.serviceTypes.includes(r.code);
                return (
                  <button
                    key={r.code}
                    type="button"
                    aria-pressed={checked}
                    onClick={() => toggleServiceType(r.code)}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left text-sm font-semibold transition-colors ${checked ? 'border-primary bg-primary/15 text-primary' : 'border-border-glass bg-surface text-on-surface hover:bg-surface-variant'}`}
                  >
                    <span>{r.label}</span>
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center border ${checked ? 'border-primary bg-primary text-on-primary' : 'border-border-glass bg-surface-variant'}`}>
                      {checked && <LuCheck className="text-xs" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">Dipilih: {formData.serviceTypes.length} layanan servis</p>
          </div>

          <label className="block">Odometer aktual saat servis (km)<input required type="number" min="0" step="0.1" className="form-input block w-full" value={formData.odometerAtService} onChange={e=>change({...formData,odometerAtService:e.target.value})}/></label>
          <label className="block">Bengkel {settings.VEHICLE_SERVICE_REQUIRE_WORKSHOP?'(wajib)':'(opsional)'}<input required={settings.VEHICLE_SERVICE_REQUIRE_WORKSHOP===true} maxLength={200} className="form-input block w-full" value={formData.workshopName} onChange={e=>change({...formData,workshopName:e.target.value})}/></label>
          <label className="block">Catatan servis {settings.VEHICLE_SERVICE_REQUIRE_NOTE?'(wajib)':'(opsional)'}<textarea required={settings.VEHICLE_SERVICE_REQUIRE_NOTE===true} maxLength={2000} className="form-input block w-full" value={formData.notes} onChange={e=>change({...formData,notes:e.target.value})}/></label>

          <section className="rounded-xl border border-border-glass p-3 space-y-3">
            <div>
              <strong className="block text-sm">{isAdmin ? 'Bukti Struk & Titik Bengkel (Input Admin)' : 'Struk Servis & Titik Absen Servis (Supir / Kepala Gudang)'}</strong>
              <p className="text-xs text-on-surface-variant">
                {isAdmin
                  ? 'Jika Supir atau Kepala Gudang lupa absen saat servis, Admin cukup melampirkan foto struk dan titik lokasi bengkel dari Google Maps.'
                  : 'Saat servis dilakukan oleh Supir atau Kepala Gudang, wajib mengunggah foto struk serta merekam titik absen GPS di lokasi servis.'}
              </p>
            </div>

            {isAdmin && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-on-surface-variant">
                  Titik Bengkel dari Google Maps (wajib — tautan Google Maps atau lat, lng)
                  <input
                    required
                    type="text"
                    placeholder="Contoh: https://www.google.com/maps?q=-6.200000,106.816666 atau -6.200000, 106.816666"
                    value={formData.mapsInput}
                    onChange={e => change({ ...formData, mapsInput: e.target.value })}
                    className="form-input block w-full mt-1"
                  />
                </label>
                {parsedAdminPoint ? (
                  <p className="text-xs text-emerald-700 font-semibold flex items-center gap-2">
                    <span>Koordinat bengkel: {parsedAdminPoint.latitude.toFixed(6)}, {parsedAdminPoint.longitude.toFixed(6)}</span>
                    <a href={googleMapsPointUrl(parsedAdminPoint.latitude, parsedAdminPoint.longitude)} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">
                      Buka Maps <LuExternalLink />
                    </a>
                  </p>
                ) : formData.mapsInput.trim() ? (
                  <p className="text-xs text-amber-700">Format titik belum terbaca. Tempel link Google Maps yang memuat koordinat atau ketik -6.2, 106.8.</p>
                ) : null}
              </div>
            )}

            <DeviceCameraCapture
              policyValues={{ ...settings, CAMERA_INPUT_MODE: 'CAMERA_OR_UPLOAD' }}
              photoRequired={true}
              requireGps={!isAdmin}
              enforceGeofence={false}
              capturedPhoto={receiptPhoto}
              onLocationChange={isAdmin ? undefined : setServiceGps}
              onCapture={(photo, gps) => {
                setDirty(true);
                setReceiptPhoto(photo);
                if (gps) setServiceGps(gps);
              }}
              onRetake={() => {
                setDirty(true);
                setReceiptPhoto(null);
              }}
              facingModeDefault="environment"
              buttonLabel={isAdmin ? 'Ambil Foto Struk Servis' : 'Jepret Struk & Titik Absen Servis'}
            />
            {!isAdmin && serviceGps && Number.isFinite(serviceGps.lat) && (
              <p className="text-xs font-semibold text-emerald-700">
                Titik absen servis terkunci: {serviceGps.lat.toFixed(6)}, {serviceGps.lng.toFixed(6)} (±{Math.round(serviceGps.accuracy || 0)} m)
              </p>
            )}
          </section>

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

