import { useApp } from '../../../context/AppContext';
import React, { useRef, useState } from 'react';
import { LuWrench, LuPlus, LuCamera } from 'react-icons/lu';
import { MaintenanceBar } from "./MaintenanceBar";
import { vehicleServiceStatus } from '../../../../../shared/vehicle-service-policy.mjs';
import { evidenceImageError } from '../../../../../shared/evidence-image-policy.mjs';
import { nativeFileCaptureService } from '../../../services/nativeFileCaptureService';
import { vehiclesApi } from '../../../services/api';

export const VehicleMaintenanceCard = ({
  vehicle,
  onRecord,
  onChanged
}) => {
  const { settings } = useApp();
  const fileRef = useRef(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const {
    totalKm,
    maxCartons,
    maxWeightKg
  } = vehicle;

  const handlePhotoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || photoBusy) return;
    setPhotoError('');
    setPhotoBusy(true);
    try {
      const maxKb = settings?.EVIDENCE_IMAGE_MAX_KB ?? 2000;
      if (file.size > maxKb * 1024) {
        throw new Error(`Ukuran foto maksimal ${maxKb} KB.`);
      }
      const dataUrl = await nativeFileCaptureService.readFileAsDataUrl(file);
      const err = evidenceImageError(dataUrl, settings || {});
      if (err) throw new Error(err);
      await vehiclesApi.setPhoto(vehicle.id, dataUrl);
      if (onChanged) await onChanged();
    } catch (err) {
      setPhotoError(err.message || 'Gagal menyimpan foto kendaraan.');
    } finally {
      setPhotoBusy(false);
    }
  };

  return <div className="bg-surface border border-border-glass rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
      {/* Photo Section */}
      <div className="w-full md:w-1/3 min-h-48 bg-surface-variant flex items-center justify-center p-6 relative">
        {vehicle.photoUrl ? <img src={vehicle.photoUrl} alt={vehicle.name} className="w-full h-full object-cover absolute inset-0" /> : <div className="text-center text-on-surface-variant flex flex-col items-center">
            <LuWrench className="text-4xl mb-2 opacity-50" />
            <span className="text-xs font-semibold">Belum Ada Foto Kendaraan</span>
            <span className="text-[11px] text-amber-700 font-semibold mt-1">Wajib foto sebelum trip</span>
          </div>}
        {onChanged && <>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoFile} />
          <button
            type="button"
            disabled={photoBusy}
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-surface/90 backdrop-blur border border-border-glass text-on-surface hover:bg-surface font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <LuCamera /> {photoBusy ? 'Menyimpan…' : vehicle.photoUrl ? 'Ubah Foto' : 'Set Foto'}
          </button>
        </>}
      </div>

      {/* Details Section */}
      <div className="flex-1 p-5 flex flex-col space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-on-surface">{vehicle.name}</h3>
            <p className="text-sm font-medium text-on-surface-variant">{vehicle.code} • {vehicle.fuelType}</p>
            {!vehicle.photoUrl && <p className="text-xs font-semibold text-amber-700 mt-1">Foto kendaraan wajib disertakan. Klik Set Foto untuk mengunggah foto armada.</p>}
            {photoError && <p role="alert" className="text-xs text-red-600 mt-1">{photoError}</p>}
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
          {vehicleServiceStatus(vehicle,settings).map(status=><MaintenanceBar key={status.key} status={status}/>)}
        </div>

        <div className="pt-3 border-t border-border-glass mt-auto flex flex-wrap gap-2">
          {onChanged && <button type="button" disabled={photoBusy} onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-border-glass bg-surface hover:bg-surface-variant font-semibold text-sm text-on-surface transition-colors">
            <LuCamera /> {photoBusy ? 'Menyimpan Foto…' : vehicle.photoUrl ? 'Ubah Foto Kendaraan' : 'Set Foto Kendaraan'}
          </button>}
          <button type="button" disabled={!onRecord} onClick={onRecord} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-sm transition-colors">
            <LuPlus /> Catat Servis
          </button>
        </div>
      </div>
    </div>;
};

