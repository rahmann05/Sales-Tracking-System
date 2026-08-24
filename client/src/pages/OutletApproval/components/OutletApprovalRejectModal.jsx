import React from 'react';
import { LuX } from 'react-icons/lu';

/**
 * OutletApprovalRejectModal Component
 * Single Responsibility: Render rejection confirmation modal with reason input.
 */
export const OutletApprovalRejectModal = ({
  isOpen,
  reason,
  isProcessing,
  onChangeReason,
  onClose,
  onConfirmReject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl border border-border-glass max-w-md w-full p-6 shadow-2xl space-y-4">
        <h4 className="text-base font-extrabold text-on-surface m-0 flex items-center gap-2 text-red-600">
          <LuX /> Tolak Pengajuan Registrasi
        </h4>
        <p className="text-xs text-on-surface-variant m-0">
          Berikan alasan penolakan agar Salesman dapat memperbaiki data pengajuan toko ini:
        </p>
        <textarea
          required
          rows={3}
          value={reason}
          onChange={(e) => onChangeReason(e.target.value)}
          placeholder="Contoh: Titik koordinat tidak cocok dengan alamat fisik, foto kurang jelas..."
          className="outlet-reg-input text-xs"
        />
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="outlet-reg-btn-outline text-xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirmReject}
            disabled={isProcessing}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all"
          >
            {isProcessing ? 'Menyimpan...' : 'Konfirmasi Tolak'}
          </button>
        </div>
      </div>
    </div>
  );
};
