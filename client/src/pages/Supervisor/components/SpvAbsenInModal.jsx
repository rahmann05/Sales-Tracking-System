import React, { useState } from 'react';
import { SPV_MODE_OPTIONS } from '../../../constants/supervisor';
import { DeviceCameraCapture } from '../../../shared/components/camera/DeviceCameraCapture';
import { LuCheck } from 'react-icons/lu';
import { SpvModalShell } from './SpvModalShell';

/**
 * SpvAbsenInModal Component
 * Single Responsibility: Modal absen masuk (clock-in) kunjungan supervisi.
 */
export const SpvAbsenInModal = ({ stop, spvMode, onChangeSpvMode, inputNotes, onChangeNotes, onClose, onConfirm, error, saving }) => {
  const [capture, setCapture] = useState(null);
  return (
    <SpvModalShell error={error} saving={saving}
        title="Absen Masuk Kunjungan Supervisi"
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
                    disabled={saving || !capture?.gps}
                    onClick={() => onConfirm({ photoUrl: capture.photoUrl, latitude: capture.gps.lat, longitude: capture.gps.lng })}
                    className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                    <LuCheck className="text-base" />
                    <span>Konfirmasi Absen Masuk</span>
                </button>
            </>
        }
    >
        <div className="space-y-4 py-3">
            <DeviceCameraCapture capturedPhoto={capture?.photoUrl} onCapture={(photoUrl, gps) => setCapture({ photoUrl, gps })} onRetake={() => setCapture(null)} requireGps targetLat={stop.latitude} targetLng={stop.longitude} maxRadiusMeters={stop.radiusMeters} outletName={stop.outletName} />
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface block">Jenis Kunjungan Supervisi:</label>
                <select 
                    value={spvMode}
                    onChange={e => onChangeSpvMode(e.target.value)}
                    className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                    {SPV_MODE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
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
