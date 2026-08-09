import { useState, useEffect } from 'react';
import { vehiclesApi } from '../services/api';

export const useVehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadVehicles = async () => {
      try {
        const res = await vehiclesApi.getAll();
        if (isMounted) setVehicles(res?.data || []);
      } catch (err) {
        console.error('Failed to load vehicles:', err);
      }
    };
    loadVehicles();
    return () => { isMounted = false; };
  }, []);

  const handleCreateVehicle = async (data) => {
    try {
      const res = await vehiclesApi.create(data);
      setVehicles((prev) => [res.data, ...prev]);
      setIsFormModalOpen(false);
    } catch (err) {
      console.error('Failed to create vehicle:', err);
      alert(err.message || 'Gagal menambahkan kendaraan');
    }
  };

  const handleUpdateVehicle = async (id, data) => {
    try {
      const res = await vehiclesApi.update(id, data);
      setVehicles((prev) => prev.map((v) => (v.id === id ? res.data : v)));
      setIsFormModalOpen(false);
      setEditingVehicle(null);
    } catch (err) {
      console.error('Failed to update vehicle:', err);
      alert(err.message || 'Gagal mengubah kendaraan');
    }
  };

  const handleDeleteVehicle = async (id) => {
    try {
      await vehiclesApi.delete(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
      alert(err.message || 'Gagal menghapus kendaraan');
    }
  };

  return {
    vehicles,
    isFormModalOpen,
    setIsFormModalOpen,
    editingVehicle,
    setEditingVehicle,
    handleCreateVehicle,
    handleUpdateVehicle,
    handleDeleteVehicle,
  };
};
