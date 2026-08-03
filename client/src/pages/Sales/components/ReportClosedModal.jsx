import React, { useState } from 'react';
import { LuCamera } from 'react-icons/lu';
import { FiXCircle } from 'react-icons/fi';

/**
 * ReportClosedModal Component (Single Responsibility: Modal for Reporting Closed Outlet Incident)
 * 1 File per Component
 */
export const ReportClosedModal = ({ stop, onClose, onSubmitReport }) => {
  const [closedReason, setClosedReason] = useState('Toko Gembok / Tutup Permanen');
  const [closedPhoto] = useState('https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=400');

  if (!stop) return null;

  const handleSubmit = () => {
    onSubmitReport({
      stopId: stop.id,
      reason: closedReason,
      photoUrl: closedPhoto,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border-glass rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-glass pb-3">
          <div>
            <h3 className="font-bold text-lg text-on-surface">Lapor Toko Tutup</h3>
            <p className="text-xs text-on-surface-variant">{stop.outletName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant">
            <FiXCircle className="text-xl" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface">Alasan Toko Tutup</label>
          <select
            value={closedReason}
            onChange={(e) => setClosedReason(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-xs font-semibold text-on-surface"
          >
            <option value="Toko Gembok / Tutup Permanen">Toko Gembok / Tutup Permanen Hari Ini</option>
            <option value="Pemilik Tidak di Tempat">Pemilik Sedang Keluar Kota</option>
            <option value="Toko Renovasi">Toko Sedang Renovasi</option>
            <option value="Akses Terhalang">Akses Jalan Terhalang / Banjir</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface">Foto Bukti Toko Tutup</label>
          <div className="relative rounded-2xl overflow-hidden aspect-video border border-border-glass">
            <img src={closedPhoto} alt="Bukti" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl text-white text-xs font-semibold flex items-center gap-1.5">
                <LuCamera className="text-sm" /> Foto Bukti Terunggah
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition-all shadow-md"
        >
          Kirim Laporan ke Supervisor
        </button>
      </div>
    </div>
  );
};
