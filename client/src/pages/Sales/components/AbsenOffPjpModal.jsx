import React, { useState } from 'react';
import { FiXCircle, FiAlertCircle } from 'react-icons/fi';
import { LuCamera } from 'react-icons/lu';

export const AbsenOffPjpModal = ({ isOpen, onClose, onSubmit }) => {
  const [absenOffPjpName, setAbsenOffPjpName] = useState('Toko Berkah Utama Cimahi');
  const [absenOffPjpAddress, setAbsenOffPjpAddress] = useState('Jl. Raya Amir Machmud No. 150, Cimahi');
  const [absenOffPjpReason, setAbsenOffPjpReason] = useState('Absen lokasi kunjungan mendadak di luar RJP');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!absenOffPjpName) {
      alert('Mohon isi nama toko.');
      return;
    }
    onSubmit({
      outletName: absenOffPjpName,
      address: absenOffPjpAddress,
      reason: absenOffPjpReason,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card space-y-4">
        <div className="modal-header">
          <div>
            <h3 className="section-title">Absen Toko di Luar RJP</h3>
            <p className="card-subtitle">Absen tercatat di sistem (Status Awal: TIDAK TERVALIDASI)</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant">
            <FiXCircle className="text-xl" />
          </button>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800 font-semibold">
          <FiAlertCircle className="text-lg flex-shrink-0 text-amber-600" />
          <span>Absen lokasi ini akan tersimpan dengan status <strong>TIDAK TERVALIDASI</strong> hingga diverifikasi oleh Supervisor.</span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="label-bold">Nama Toko Kunjungan (Luar RJP):</label>
            <input
              type="text"
              value={absenOffPjpName}
              onChange={(e) => setAbsenOffPjpName(e.target.value)}
              placeholder="Nama Toko"
              className="form-input"
            />
          </div>

          <div className="space-y-1">
            <label className="label-bold">Alamat / Lokasi Toko:</label>
            <input
              type="text"
              value={absenOffPjpAddress}
              onChange={(e) => setAbsenOffPjpAddress(e.target.value)}
              placeholder="Alamat Toko"
              className="form-input"
            />
          </div>

          <div className="space-y-1">
            <label className="label-bold">Catatan Kunjungan:</label>
            <textarea
              value={absenOffPjpReason}
              onChange={(e) => setAbsenOffPjpReason(e.target.value)}
              rows={2}
              className="form-textarea"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-tertiary text-on-tertiary font-bold text-xs rounded-xl hover:bg-tertiary/90 transition-all shadow-md flex items-center justify-center gap-1.5"
        >
          <LuCamera className="text-base" />
          <span>Simpan Absen (Status: TIDAK TERVALIDASI)</span>
        </button>
      </div>
    </div>
  );
};
