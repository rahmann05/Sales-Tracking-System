import React, { useState, useEffect } from 'react';
import { LuX, LuSave } from 'react-icons/lu';
import '../../../../styles/components/ReassignDayRouteModal.css';

/**
 * ReassignDayRouteModal Component
 * Single Responsibility: Form modal for Supervisor to adjust route and quota for a single day.
 * 1 File = 1 Component
 */
export const ReassignDayRouteModal = ({ isOpen, onClose, cellData, onSave }) => {
  const [clusterName, setClusterName] = useState('');
  const [outletsCount, setOutletsCount] = useState(15);
  const [subDistrict, setSubDistrict] = useState('');

  useEffect(() => {
    if (cellData?.currentData) {
      setClusterName(cellData.currentData.clusterName || '');
      setOutletsCount(cellData.currentData.outletsCount || 15);
      setSubDistrict(cellData.currentData.subDistrict || '');
    }
  }, [cellData]);

  if (!isOpen || !cellData) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      salesId: cellData.salesId,
      day: cellData.day,
      clusterName,
      outletsCount,
      subDistrict,
    });
  };

  return (
    <div className="reassign-modal-backdrop">
      <div className="reassign-modal-box">
        <div className="reassign-modal-header">
          <div>
            <h3 className="reassign-modal-title">
              Ubah Rute: {cellData.day}
            </h3>
            <p className="text-xs text-on-surface-variant font-medium">Penyesuaian Sub-Rute & Target Kunjungan</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-variant/50 hover:bg-surface-variant text-on-surface-variant flex items-center justify-center transition-colors"
          >
            <LuX className="text-base" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="reassign-modal-body">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface">Nama Sub-Rute / Klaster</label>
              <input
                type="text"
                value={clusterName}
                onChange={(e) => setClusterName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-glass bg-surface-variant/30 text-on-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                placeholder="misal: Cimahi Selatan (Cibeureum)"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface">Target Jumlah Outlet Kunjungan</label>
              <input
                type="number"
                min="1"
                max="50"
                value={outletsCount}
                onChange={(e) => setOutletsCount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-glass bg-surface-variant/30 text-on-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface">Kecamatan / Area Fokus</label>
              <input
                type="text"
                value={subDistrict}
                onChange={(e) => setSubDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-glass bg-surface-variant/30 text-on-surface text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                placeholder="misal: Cibeureum"
              />
            </div>
          </div>

          <div className="reassign-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border-glass bg-surface hover:bg-surface-variant text-on-surface text-xs font-bold transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              <LuSave className="text-sm" />
              <span>Terapkan Rute</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

