import React, { useState } from 'react';
import { LuCamera, LuUpload, LuCheck } from 'react-icons/lu';
import { FiXCircle } from 'react-icons/fi';

/**
 * ReportClosedModal Component (Single Responsibility: Modal for Reporting Closed Outlet Incident)
 * 1 File per Component
 */
export const ReportClosedModal = ({ stop, onClose, onSubmitReport }) => {
  const [closedReason, setClosedReason] = useState('Toko Gembok / Tutup Permanen');
  const [closedPhoto, setClosedPhoto] = useState(null);

  if (!stop) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setClosedPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    onSubmitReport({
      stopId: stop.id,
      reason: closedReason,
      photoUrl: closedPhoto || null,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3 className="font-bold text-lg text-on-surface">Lapor Toko Tutup</h3>
            <p className="text-xs text-on-surface-variant">{stop.outletName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant">
            <FiXCircle className="text-xl" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="form-label">Alasan Toko Tutup</label>
          <select
            value={closedReason}
            onChange={(e) => setClosedReason(e.target.value)}
            className="form-select"
          >
            <option value="Toko Gembok / Tutup Permanen">Toko Gembok / Tutup Permanen Hari Ini</option>
            <option value="Pemilik Tidak di Tempat">Pemilik Sedang Keluar Kota</option>
            <option value="Toko Renovasi">Toko Sedang Renovasi</option>
            <option value="Akses Terhalang">Akses Jalan Terhalang / Banjir</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="form-label">Foto Bukti Toko Tutup (Kamera / Unggah)</label>
          {closedPhoto ? (
            <div className="relative rounded-2xl overflow-hidden aspect-video border border-border-glass">
              <img src={closedPhoto} alt="Bukti Tutup" className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2">
                <button
                  type="button"
                  onClick={() => setClosedPhoto(null)}
                  className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-[11px] font-semibold hover:bg-black/80 transition-all"
                >
                  Ubah Foto
                </button>
              </div>
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5">
                <LuCheck className="text-emerald-400 text-sm" /> Foto Bukti Terambil
              </div>
            </div>
          ) : (
            <label className="border-2 border-dashed border-border-glass hover:border-primary/50 bg-surface-variant/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all gap-2 group">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <LuCamera className="text-xl" />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-on-surface block">Ambil Foto / Unggah Bukti</span>
                <span className="text-[11px] text-on-surface-variant">Klik untuk membuka kamera HP atau pilih file</span>
              </div>
            </label>
          )}
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
