import React from 'react';
import { LuCheck } from 'react-icons/lu';
import { SpvModalShell } from './SpvModalShell';

/**
 * SpvOffPjpModal Component
 * Single Responsibility: Modal absen kunjungan supervisi luar jadwal / toko dadakan.
 */
export const SpvOffPjpModal = ({ form, onChangeForm, onClose, onConfirm }) => (
    <SpvModalShell
        title="Kunjungan Supervisi Luar RJP"
        subtitle="Catat kunjungan toko di luar agenda harian"
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
                    <span>Simpan Absen Supervisi</span>
                </button>
            </>
        }
    >
        <div className="space-y-3.5 py-2">
            <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface block">Nama Outlet / Toko:</label>
                <input
                    type="text"
                    value={form.outletName}
                    onChange={(e) => onChangeForm({ ...form, outletName: e.target.value })}
                    placeholder="Misal: Toko Berkah Abadi"
                    className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface block">Alamat / Lokasi Toko:</label>
                <input
                    type="text"
                    value={form.address}
                    onChange={(e) => onChangeForm({ ...form, address: e.target.value })}
                    placeholder="Misal: Jl. Raya Cimahi No. 100"
                    className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface block">Alasan Kunjungan Supervisi:</label>
                <textarea
                    rows={2}
                    value={form.reason}
                    onChange={(e) => onChangeForm({ ...form, reason: e.target.value })}
                    placeholder="Misal: Permintaan audit toko baru, penyelesaian sengketa barang, dll..."
                    className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
            </div>
        </div>
    </SpvModalShell>
);
