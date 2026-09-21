import React, { useState, useEffect } from 'react';
import { LuX, LuSave, LuPlus } from 'react-icons/lu';

export const VehicleFormModal = ({ isOpen, onClose, onSubmit, vehicle = null }) => {
  const isEditMode = !!vehicle;

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    maxCartons: 100,
    maxWeightKg: 1000,
    fuelType: 'Solar Dexlite',
    fuelKmPerLiter: 8,
    fuelPricePerLiter: 6800,
    isActive: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (vehicle) {
        setFormData({
          code: vehicle.code || '',
          name: vehicle.name || '',
          maxCartons: vehicle.maxCartons || 100,
          maxWeightKg: vehicle.maxWeightKg || 1000,
          fuelType: vehicle.fuelType || 'Solar Dexlite',
          fuelKmPerLiter: vehicle.fuelKmPerLiter || 8,
          fuelPricePerLiter: vehicle.fuelPricePerLiter || 6800,
          isActive: vehicle.isActive ?? true,
        });
      } else {
        setFormData({
          code: '',
          name: '',
          maxCartons: 0,
          maxWeightKg: 0,
          fuelType: '',
          fuelKmPerLiter: 0,
          fuelPricePerLiter: 0,
          isActive: true,
        });
      }
    }
  }, [isOpen, vehicle]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      alert('Kode dan Nama Kendaraan wajib diisi!');
      return;
    }
    
    // Parse numeric fields
    const payload = {
      ...formData,
      maxCartons: parseInt(formData.maxCartons, 10),
      maxWeightKg: parseFloat(formData.maxWeightKg),
      fuelKmPerLiter: parseFloat(formData.fuelKmPerLiter),
      fuelPricePerLiter: parseFloat(formData.fuelPricePerLiter),
    };
    
    onSubmit(isEditMode ? { ...payload, id: vehicle.id } : payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">
            {isEditMode ? 'Edit Spesifikasi Kendaraan' : 'Tambah Kendaraan Baru'}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <LuX className="text-xl" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="vehicle-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Kendaraan</label>
                <input
                  type="text"
                  placeholder="misal: BLIND_VAN"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                  required
                  disabled={isEditMode} // Cannot edit code after creation typically
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama / Tipe</label>
                <input
                  type="text"
                  placeholder="misal: Daihatsu Gran Max (Blind Van)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maks. Kapasitas (Karton)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxCartons}
                  onChange={(e) => setFormData({ ...formData, maxCartons: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maks. Berat (Kg)</label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.maxWeightKg}
                  onChange={(e) => setFormData({ ...formData, maxWeightKg: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis BBM</label>
                <input
                  type="text"
                  placeholder="misal: Pertalite"
                  value={formData.fuelType}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konsumsi (Km/Liter)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.fuelKmPerLiter}
                  onChange={(e) => setFormData({ ...formData, fuelKmPerLiter: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga BBM (Rp/Liter)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.fuelPricePerLiter}
                  onChange={(e) => setFormData({ ...formData, fuelPricePerLiter: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                  Status Aktif (Tersedia untuk logistik)
                </label>
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
            Batal
          </button>
          <button type="submit" form="vehicle-form" className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 font-medium">
            {isEditMode ? <><LuSave /> Simpan</> : <><LuPlus /> Tambah Kendaraan</>}
          </button>
        </div>
      </div>
    </div>
  );
};
