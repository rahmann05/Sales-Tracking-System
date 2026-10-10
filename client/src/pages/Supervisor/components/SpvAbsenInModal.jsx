import React, { useState } from 'react';
import { SPV_MODE_OPTIONS } from '../../../constants/supervisor';
import { DeviceCameraCapture } from '../../../shared/components/camera/DeviceCameraCapture';
import { LuCheck } from 'react-icons/lu';
import { SpvModalShell } from './SpvModalShell';
import {useApp} from '../../../context/AppContext';

/**
 * SpvAbsenInModal Component
 * Single Responsibility: Modal absen masuk (clock-in) kunjungan supervisi.
 */
export const SpvAbsenInModal = ({ stop, spvMode, onChangeSpvMode, inputNotes, onChangeNotes, onClose, onConfirm, error, saving }) => {
  const [capture, setCapture] = useState(null);
  const {settings}=useApp();
  const optional=settings.SPV_ATTENDANCE_MODE==='OPTIONAL',photoRequired=!optional&&settings.SPV_REQUIRE_PHOTO,gpsRequired=!optional&&settings.SPV_REQUIRE_GPS;
  return (
    <SpvModalShell error={error} saving={saving}
        title={optional?'Mulai kegiatan supervisi':'Absen masuk kunjungan supervisi'}
        subtitle={stop.outletName}
        onClose={onClose}
        footer={
            <>
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-border-glass text-xs font-bold text-on-surface-variant hover:bg-surface-variant cursor-pointer"
                >
                    Batal
                </button>
                <button
                    type="button"
                    disabled={saving || gpsRequired&&!capture?.gps || photoRequired&&!capture?.photoUrl}
                    onClick={() => onConfirm({ photoUrl: capture?.photoUrl, accuracy:capture?.gps?.accuracy,observedAt:capture?.gps?.observedAt,latitude: capture?.gps?.lat, longitude: capture?.gps?.lng })}
                    className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                    <LuCheck className="text-base" />
                    <span>{optional?'Mulai kegiatan':'Konfirmasi absen masuk'}</span>
                </button>
            </>
        }
    >
        <div className="space-y-4 py-3">
            {!optional&&<DeviceCameraCapture policyValues={settings} photoRequired={photoRequired} capturedPhoto={capture?.photoUrl} onCapture={(photoUrl, gps) => setCapture({ photoUrl, gps })} onLocationChange={photoRequired?undefined:gps=>setCapture(c=>({...c,gps}))} onRetake={() => setCapture(null)} requireGps={gpsRequired} enforceGeofence={settings.SPV_ENFORCE_GEOFENCE} targetLat={stop.latitude} targetLng={stop.longitude} maxRadiusMeters={stop.radiusMeters} outletName={stop.outletName} />}
            <p className="text-sm">{optional?'Presensi foto dan GPS tidak diwajibkan. Aktivitas supervisi tetap dicatat.':`Foto ${photoRequired?'wajib':'opsional'} · GPS ${gpsRequired?'wajib':'opsional'}`}</p>
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface block">Jenis Kunjungan Supervisi:</label>
                <select 
                    value={spvMode}
                    onChange={e => onChangeSpvMode(e.target.value)}
                    className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                    {SPV_MODE_OPTIONS.filter(o=>o.id!=='JOINT_VISIT'||settings.SPV_ALLOW_JOINT_VISIT).filter(o=>o.id!=='PRIORITY_AUDIT'||settings.SPV_ALLOW_PRIORITY_AUDIT).map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface block">Catatan Awal Kunjungan (Opsional):</label>
                <input
                    type="text"
                    value={inputNotes}
                    onChange={(e) => onChangeNotes(e.target.value)}
                    placeholder="Kondisi toko saat tiba, sales pendamping, dll..."
                    className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
            </div>
        </div>
    </SpvModalShell>
);
};
