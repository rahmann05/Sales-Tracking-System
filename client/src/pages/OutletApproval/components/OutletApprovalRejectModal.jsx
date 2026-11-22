import React from 'react';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';

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
  return (
    <NativeDialog
      open={isOpen}
      title="Tolak Pengajuan Registrasi"
      busy={isProcessing}
      onClose={onClose}
      className="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-xs text-on-surface-variant m-0">
          Berikan alasan penolakan agar Salesman dapat memperbaiki data pengajuan toko ini:
        </p>
        <textarea
          required
          autoFocus
          rows={3}
          disabled={isProcessing}
          value={reason}
          onChange={(e) => onChangeReason(e.target.value)}
          placeholder="Contoh: Titik koordinat tidak cocok dengan alamat fisik, foto kurang jelas..."
          className="outlet-reg-input text-xs"
        />
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="outlet-reg-btn-outline text-xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirmReject}
            disabled={isProcessing}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all min-h-[44px]"
          >
            {isProcessing ? 'Menyimpan...' : 'Konfirmasi Tolak'}
          </button>
        </div>
      </div>
    </NativeDialog>
  );
};
