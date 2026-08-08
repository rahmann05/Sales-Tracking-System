import React from 'react';
import { LuCamera, LuCheck } from 'react-icons/lu';
import { SpvModalShell } from './SpvModalShell';

/**
 * SpvAbsenInModal Component
 * Single Responsibility: Modal absen masuk (clock-in) kunjungan supervisi.
 */
export const SpvAbsenInModal = ({ stop, inputNotes, onChangeNotes, onClose, onConfirm }) => (
    <SpvModalShell
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
                    onClick={onConfirm}
                    className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                    <LuCheck className="text-base" />
                    <span>Konfirmasi Absen Masuk</span>
                </button>
            </>
        }
    >
        <div className="space-y-4 py-3">
            <div className="h-44 bg-surface-variant/40 rounded-2xl border-2 border-dashed border-border-glass flex flex-col items-center justify-center text-center p-4">
                <LuCamera className="text-3xl text-primary mb-2" />
                <span className="text-xs font-bold text-on-surface">Foto Kehadiran di Outlet</span>
                <span className="text-[10px] text-on-surface-variant mt-0.5">
                    GPS Terverifikasi: Radius {stop.currentDistance}m dari lokasi outlet
                </span>
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
