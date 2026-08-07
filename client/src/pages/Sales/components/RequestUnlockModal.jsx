import React, { useState } from 'react';
import { FiXCircle } from 'react-icons/fi';
import { LuKey, LuSend } from 'react-icons/lu';

/**
 * RequestUnlockModal Component
 * Single Responsibility: Modal for Sales Rep to submit an outlet unlock request to Admin / Supervisor.
 */
export const RequestUnlockModal = ({ stop, activeVisitingStop, onClose, onSubmitUnlockRequest }) => {
  const [reason, setReason] = useState('Toko sebelumnya belum selesai proses atau terkendala akses');

  if (!stop) return null;

  const handleSubmit = () => {
    onSubmitUnlockRequest({
      stopId: stop.id,
      outletName: stop.outletName,
      address: stop.address,
      activeVisitingOutlet: activeVisitingStop?.outletName || 'Outlet Sebelumnya',
      reason,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="bg-surface border border-border-glass rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="modal-header">
          <div>
            <h3 className="font-bold text-lg text-on-surface">Minta Buka Kunci (Unlock)</h3>
            <p className="text-xs text-on-surface-variant">Tujuan: {stop.outletName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant"
          >
            <FiXCircle className="text-xl" />
          </button>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-800 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-amber-900">
            <LuKey className="text-sm" /> Status Kunjungan Saat Ini
          </p>
          <p>
            Anda masih tercatat memiliki kunjungan aktif di{' '}
            <strong>{activeVisitingStop?.outletName || 'Outlet Lain'}</strong> tanpa Absen Out.
          </p>
          <p className="text-[11px] text-amber-700">
            Kirimkan permohonan ke Admin/Supervisor agar outlet ini dapat dibuka untuk presensi.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface">Alasan Permintaan Unlock:</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="Toko sebelumnya tutup mendadak / gembok">Toko sebelumnya tutup mendadak / gembok</option>
            <option value="Urutan kunjungan dialihkan karena rute jalan macet">Urutan kunjungan dialihkan karena rute jalan macet</option>
            <option value="Pemilik toko sebelumnya meminta reschedule kunjungan">Pemilik toko sebelumnya meminta reschedule kunjungan</option>
            <option value="Kendala sinyal / teknis pada saat Absen Out toko sebelumnya">Kendala sinyal / teknis pada saat Absen Out toko sebelumnya</option>
            <option value="Lainnya (Izin Khusus Supervisor)">Lainnya (Izin Khusus Supervisor)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
        >
          <LuSend className="text-sm" />
          <span>Kirim Permohonan Unlock ke Admin</span>
        </button>
      </div>
    </div>
  );
};
