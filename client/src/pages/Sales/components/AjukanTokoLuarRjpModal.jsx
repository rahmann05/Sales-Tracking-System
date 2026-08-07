import React, { useState } from 'react';
import { FiXCircle } from 'react-icons/fi';

export const AjukanTokoLuarRjpModal = ({ isOpen, onClose, onSubmit }) => {
  const [offPjpName, setOffPjpName] = useState('Toko Serba Ada Padalarang');
  const [offPjpAddress, setOffPjpAddress] = useState('Jl. Raya Padalarang No. 120, KBB');
  const [offPjpReason, setOffPjpReason] = useState('Permintaan pesanan mendesak dari pemilik toko');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!offPjpName) {
      alert('Nama toko wajib diisi');
      return;
    }
    onSubmit({
      outletName: offPjpName,
      address: offPjpAddress,
      reason: offPjpReason,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3 className="font-bold text-lg text-on-surface">Ajukan Toko di Luar RJP</h3>
            <p className="text-xs text-on-surface-variant">Membutuhkan Persetujuan Supervisor (SPV)</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant">
            <FiXCircle className="text-xl" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="form-label">Nama Toko Pengganti / Luar RJP:</label>
            <input
              type="text"
              value={offPjpName}
              onChange={(e) => setOffPjpName(e.target.value)}
              placeholder="Nama Toko"
              className="form-select"
            />
          </div>

          <div className="space-y-1">
            <label className="form-label">Alamat Lengkap Toko:</label>
            <input
              type="text"
              value={offPjpAddress}
              onChange={(e) => setOffPjpAddress(e.target.value)}
              placeholder="Alamat Toko"
              className="form-input"
            />
          </div>

          <div className="space-y-1">
            <label className="form-label">Alasan Pengajuan Kunjungan:</label>
            <textarea
              value={offPjpReason}
              onChange={(e) => setOffPjpReason(e.target.value)}
              rows={2}
              className="form-textarea"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-secondary text-on-secondary font-bold text-xs rounded-xl hover:bg-secondary/90 transition-all shadow-md"
        >
          Kirim Pengajuan ke Supervisor
        </button>
      </div>
    </div>
  );
};
