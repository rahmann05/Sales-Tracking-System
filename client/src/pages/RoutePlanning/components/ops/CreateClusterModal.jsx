import React, { useState } from 'react';
import { LuX, LuPlus } from 'react-icons/lu';
import '../../../../styles/components/CreateClusterModal.css';

/**
 * CreateClusterModal Component
 * Single Responsibility: Form modal for creating a new RJP Master Cluster.
 * 1 File = 1 Component
 */
export const CreateClusterModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    region: 'Kota Cimahi',
    subDistrictsStr: '',
    allocatedOutletsCount: 20,
    assignedSpvName: 'Ahmad Subagja',
    spvTeamName: 'Tim SPV Ahmad Subagja (Cimahi - KBB)',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama Cluster wajib diisi!');
      return;
    }

    const subDistricts = formData.subDistrictsStr
      ? formData.subDistrictsStr.split(',').map((s) => s.trim())
      : ['Wilayah Baru'];

    onSubmit({
      ...formData,
      subDistricts,
    });
  };

  return (
    <div className="create-cluster-modal-backdrop">
      <div className="create-cluster-modal-box">
        <div className="create-cluster-modal-header">
          <h3 className="create-cluster-modal-title">Buat Master Cluster RJP Baru</h3>
          <button type="button" onClick={onClose} className="create-cluster-modal-close">
            <LuX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="create-cluster-modal-body">
            {/* Cluster Name */}
            <div className="create-cluster-form-group">
              <label className="create-cluster-label">Nama Master Cluster</label>
              <input
                type="text"
                placeholder="misal: Klaster Cisarua & Parongpong Baru"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="create-cluster-input"
                required
              />
            </div>

            {/* Region */}
            <div className="create-cluster-form-group">
              <label className="create-cluster-label">Wilayah Administratif</label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="create-cluster-select"
              >
                <option value="Kota Cimahi">Kota Cimahi</option>
                <option value="Kab. Bandung Barat">Kab. Bandung Barat</option>
                <option value="Kota Bandung Barat Perbatasan">Kota Bandung Barat Perbatasan</option>
              </select>
            </div>

            {/* Sub-Districts / Kecamatan */}
            <div className="create-cluster-form-group">
              <label className="create-cluster-label">Cakupan Kecamatan / Kelurahan (Pisahkan koma)</label>
              <input
                type="text"
                placeholder="misal: Cisarua, Kertawangi, Pasirhalang"
                value={formData.subDistrictsStr}
                onChange={(e) => setFormData({ ...formData, subDistrictsStr: e.target.value })}
                className="create-cluster-input"
              />
            </div>

            {/* Quota Outlets */}
            <div className="create-cluster-form-group">
              <label className="create-cluster-label">Target Alokasi Jumlah Outlet</label>
              <input
                type="number"
                min="1"
                max="200"
                value={formData.allocatedOutletsCount}
                onChange={(e) => setFormData({ ...formData, allocatedOutletsCount: e.target.value })}
                className="create-cluster-input"
                required
              />
            </div>

            {/* Assigned SPV */}
            <div className="create-cluster-form-group">
              <label className="create-cluster-label">Tugaskan ke Supervisor</label>
              <select
                value={formData.assignedSpvName}
                onChange={(e) => {
                  const spv = e.target.value;
                  setFormData({
                    ...formData,
                    assignedSpvName: spv,
                    spvTeamName:
                      spv === 'Ahmad Subagja'
                        ? 'Tim SPV Ahmad Subagja (Cimahi - KBB)'
                        : 'Tim SPV Budi Kurniawan (Lembang & Parongpong)',
                  });
                }}
                className="create-cluster-select"
              >
                <option value="Ahmad Subagja">Ahmad Subagja (Tim Cimahi & KBB)</option>
                <option value="Budi Kurniawan">Budi Kurniawan (Tim Lembang & Parongpong)</option>
              </select>
            </div>
          </div>

          <div className="create-cluster-modal-footer">
            <button type="button" onClick={onClose} className="create-cluster-btn-cancel">
              Batal
            </button>
            <button type="submit" className="create-cluster-btn-submit">
              <LuPlus className="inline mr-1" /> Simpan Cluster
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
