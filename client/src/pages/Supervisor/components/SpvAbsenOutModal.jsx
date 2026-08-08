import React from 'react';
import { LuCheck, LuCircleCheck } from 'react-icons/lu';
import { SpvModalShell } from './SpvModalShell';

/**
 * SpvAbsenOutModal Component
 * Single Responsibility: Modal konfirmasi absen keluar (selesai kunjungan supervisi).
 */
export const SpvAbsenOutModal = ({ stop, onClose, onConfirm }) => (
    <SpvModalShell
        title="Absen Keluar (Selesai Kunjungan)"
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
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                    <LuCheck className="text-base" />
                    <span>Konfirmasi Selesai</span>
                </button>
            </>
        }
    >
        <div className="space-y-4 py-3 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
                <LuCircleCheck />
            </div>
            <div>
                <h4 className="font-bold text-on-surface text-base">Selesaikan Kunjungan Supervisi?</h4>
                <p className="text-xs text-on-surface-variant max-w-xs mx-auto mt-1">
                    Waktu check-out akan dicatat dan status kunjungan outlet akan berubah menjadi Selesai.
                </p>
            </div>
        </div>
    </SpvModalShell>
);
