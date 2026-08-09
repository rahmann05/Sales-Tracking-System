import React, { useState, useEffect } from 'react';
import { LuX, LuPlus, LuSave } from 'react-icons/lu';
import '../../../../styles/components/CreateClusterModal.css';

/**
 * ClusterFormModal Component
 * Form modal for creating or editing a RJP Master Cluster.
 */
export const ClusterFormModal = ({ isOpen, onClose, onSubmit, cluster = null }) => {
  const isEditMode = !!cluster;

  const [formData, setFormData] = useState({
    name: '',
    region: '',
    colorHex: '#000000', // Default HTML color picker value
  });

  useEffect(() => {
    if (isOpen) {
      if (cluster) {
        setFormData({
          name: cluster.name || '',
          region: cluster.region || '',
          colorHex: cluster.colorHex || '#000000',
        });
      } else {
        setFormData({
          name: '',
          region: '',
          colorHex: '#000000',
        });
      }
    }
  }, [isOpen, cluster]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama Cluster wajib diisi!');
      return;
    }
    
    // Pass the cluster id if in edit mode so the parent knows which one to update
    onSubmit(isEditMode ? { ...formData, id: cluster.id } : formData);
  };

  return (
    <div className="create-cluster-modal-backdrop">
      <div className="create-cluster-modal-box">
        <div className="create-cluster-modal-header">
          <h3 className="create-cluster-modal-title">
            {isEditMode ? 'Edit Klaster RJP' : 'Buat Klaster RJP Baru'}
          </h3>
          <button type="button" onClick={onClose} className="create-cluster-modal-close">
            <LuX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="create-cluster-modal-body flex flex-col gap-4">
            
            <div className="create-cluster-form-group">
              <label className="create-cluster-label">Nama Klaster</label>
              <input
                type="text"
                placeholder="misal: Klaster Cimahi Tengah"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="create-cluster-input w-full p-2 border rounded"
                required
              />
            </div>

            <div className="create-cluster-form-group">
              <label className="create-cluster-label">Wilayah Administratif</label>
              <input
                type="text"
                placeholder="misal: Kota Cimahi"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="create-cluster-input w-full p-2 border rounded"
                required
              />
            </div>

            <div className="create-cluster-form-group">
              <label className="create-cluster-label">Warna Representasi (Peta & UI)</label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  value={formData.colorHex}
                  onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                  className="w-12 h-10 p-1 border rounded cursor-pointer"
                />
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {formData.colorHex}
                </span>
              </div>
            </div>

          </div>

          <div className="create-cluster-modal-footer mt-6 flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2">
              {isEditMode ? <><LuSave /> Simpan Perubahan</> : <><LuPlus /> Buat Klaster</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
