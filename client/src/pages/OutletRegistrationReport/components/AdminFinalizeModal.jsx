import {useApp} from '../../../context/AppContext';
import React, { useState } from 'react';
import { LuCheckCheck, LuX, LuStore } from 'react-icons/lu';
import { BusinessCodeInput } from '../../../shared/components/common/BusinessCodeInput';
import { manualCodeRequired } from '../../../../../shared/coding.mjs';

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
  const {clusters,settings}=useApp();
  const [clusterId,setClusterId]=useState(item?.clusterId||'');
  const [customerCode, setCustomerCode] = useState(
    item?.customerCode || ''
  );

  if(!item)return null;
  const handleSubmit = (e) => {
    e.preventDefault();
    if (manualCodeRequired('OUTLET',settings) && !customerCode.trim()) {
      alert('Kode Outlet wajib diisi!');
      return;
    }
    onConfirmFinalize(item.id, customerCode.trim(),clusterId);
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
          <BusinessCodeInput entity="OUTLET" value={customerCode} onChange={setCustomerCode} disabled={isProcessing} />

          <label className="block">Klaster wilayah <select required value={clusterId} onChange={e=>setClusterId(e.target.value)} className="block w-full p-3 border rounded-xl"><option value="">Pilih klaster</option>{clusters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
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
