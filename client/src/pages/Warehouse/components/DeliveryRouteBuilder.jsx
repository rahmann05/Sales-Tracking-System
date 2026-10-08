import React, { useState, useEffect, useCallback } from 'react';
import { deliveryApi } from '../../../services/api';
import {useApp} from '../../../context/AppContext';
import {AdminRoutesWorkspace} from '../../../pages/Admin/components/AdminRoutesWorkspace';
/**
 * DeliveryRouteBuilder — Create and manage delivery routes for Kepala Gudang.
 */
export const DeliveryRouteBuilder = () => {
  const {user}=useApp();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [page,setPage]=useState(1); const [total,setTotal]=useState(0);const [error,setError]=useState('');
  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryApi.getDeliveryRoutes({
        limit: 20, page
      });
      if (res.success) {setRoutes(res.data.items || []);setTotal(res.data.total);setError('');}
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);
  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await deliveryApi.updateRouteStatus(id, newStatus);
      fetchRoutes();
    } catch (err) {
      setError(err.message || 'Gagal update status');
    }
  };
  const handleDelete = async id => {
    if (!confirm('Hapus rute ini?')) return;
    try {
      await deliveryApi.deleteDeliveryRoute(id);
      fetchRoutes();
    } catch (err) {
      setError(err.message || 'Gagal menghapus');
    }
  };
  return <AdminRoutesWorkspace role={user?.role} routes={routes} loading={loading} error={error} page={page} total={total} setPage={setPage} showCreateForm={showCreateForm} setShowCreateForm={setShowCreateForm} fetchRoutes={fetchRoutes} handleStatusUpdate={handleStatusUpdate} handleDelete={handleDelete}/>;
};
