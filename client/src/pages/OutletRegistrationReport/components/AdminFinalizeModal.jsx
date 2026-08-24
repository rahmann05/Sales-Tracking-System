import React, { useState } from 'react';
import { LuCheckCheck, LuX, LuStore } from 'react-icons/lu';

/**
 * AdminFinalizeModal Component
 * Single Responsibility: Render modal for Admin to assign Kode Outlet and link cluster to activate into Master Outlet table.
 */
export const AdminFinalizeModal = ({
  item,
  isProcessing,
  onClose,
  onConfirmFinalize,
}) => {
  if (!item) return null;

  const [customerCode, setCustomerCode] = useState(
    item.customerCode || `PVC00${Math.floor(10 + Math.random() * 90)}`
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerCode.trim()) {
      alert('Kode Outlet wajib diisi!');
      return;
    }
    onConfirmFinalize(item.id, customerCode.trim());
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl border border-border-glass max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border-glass">
          <h4 className="text-base font-extrabold text-on-surface m-0 flex items-center gap-2 text-emerald-600">
            <LuStore /> Input Outlet ke Sistem Aktif
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-lg font-bold"
          >
            <LuX />
          </button>
        </div>

        <p className="text-xs text-on-surface-variant m-0">
          Anda akan mendaftarkan <strong>{item.name}</strong> secara permanen ke dalam tabel master <strong>Outlet</strong> sistem.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="outlet-reg-label">
              TETAPKAN KODE OUTLET (CUSTOMER ID) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
              className="outlet-reg-input font-mono font-bold text-sm text-primary uppercase"
              placeholder="Contoh: PVC0015"
            />
            <p className="text-[10px] text-on-surface-variant mt-1 m-0">
              Format standar: PVC + 4 digit angka (misal: PVC0001, PVC0015)
            </p>
          </div>

          <div className="p-3 bg-surface-container-low rounded-xl border border-border-glass space-y-1">
            <div>
              <strong>Wilayah Area:</strong> {item.area} ({item.subAreaKecamatan || '-'})
            </div>
            <div>
              <strong>Tipe Outlet:</strong> {item.channel === 'MODERN_TRADE' ? 'Modern Trade (MT)' : 'General Trade (GT)'}
            </div>
            <div>
              <strong>Salesman:</strong> {item.salesmanName || '-'}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="outlet-reg-btn-outline text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
            >
              <LuCheckCheck /> {isProcessing ? 'Menyimpan...' : 'Simpan & Aktifkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
