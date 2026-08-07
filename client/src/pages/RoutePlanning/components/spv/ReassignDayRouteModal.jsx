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
          <h3 className="reassign-modal-title">
            Ubah Rute: {cellData.day}
          </h3>
          <button type="button" onClick={onClose} className="create-cluster-modal-close">
            <LuX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="reassign-modal-body">
            <div className="create-cluster-form-group">
              <label className="create-cluster-label">Nama Sub-Rute / Klaster</label>
              <input
                type="text"
                value={clusterName}
                onChange={(e) => setClusterName(e.target.value)}
                className="create-cluster-input"
                placeholder="misal: Cimahi Selatan (Cibeureum)"
                required
              />
            </div>

            <div className="create-cluster-form-group">
              <label className="create-cluster-label">Target Jumlah Outlet Kunjungan</label>
              <input
                type="number"
                min="1"
                max="50"
                value={outletsCount}
                onChange={(e) => setOutletsCount(e.target.value)}
                className="create-cluster-input"
                required
              />
            </div>

            <div className="create-cluster-form-group">
              <label className="create-cluster-label">Kecamatan / Area Fokus</label>
              <input
                type="text"
                value={subDistrict}
                onChange={(e) => setSubDistrict(e.target.value)}
                className="create-cluster-input"
                placeholder="misal: Cibeureum"
              />
            </div>
          </div>

          <div className="reassign-modal-footer">
            <button type="button" onClick={onClose} className="create-cluster-btn-cancel">
              Batal
            </button>
            <button type="submit" className="create-cluster-btn-submit">
              <LuSave className="inline mr-1" /> Terapkan Rute
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
