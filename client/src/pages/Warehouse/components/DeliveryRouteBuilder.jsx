import { RouteCard } from "./DeliveryRouteCard";
import { CreateRouteForm } from "./CreateRouteForm";
import {RouteOperationsActions} from './RouteOperationsActions';
import React, { useState, useEffect, useCallback } from 'react';
import { deliveryApi } from '../../../services/api';
import { LuNavigation, LuPlus, LuX } from "react-icons/lu";
/**
 * DeliveryRouteBuilder — Create and manage delivery routes for Kepala Gudang.
 */
export const DeliveryRouteBuilder = () => {
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
      alert(err.message || 'Gagal update status');
    }
  };
  const handleDelete = async id => {
    if (!confirm('Hapus rute ini?')) return;
    try {
      await deliveryApi.deleteDeliveryRoute(id);
      fetchRoutes();
    } catch (err) {
      alert(err.message || 'Gagal menghapus');
    }
  };
  return <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto pb-16 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <LuNavigation className="text-primary" />
            Kelola Rute Pengiriman
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Buat rute, tetapkan kendaraan & supir, atur urutan toko</p>
        </div>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity">
          {showCreateForm ? <LuX /> : <LuPlus />}
          {showCreateForm ? 'Batal' : 'Buat Rute Baru'}
        </button>
      </div>

      {showCreateForm && <CreateRouteForm onCreated={() => {
      setShowCreateForm(false);
      fetchRoutes();
    }} onCancel={() => setShowCreateForm(false)} />}

      {/* Route List */}
      {error&&<p role="alert" className="text-red-600">{error}</p>}
      <div className="flex gap-3 items-center"><button disabled={page===1||loading} className="min-h-11 border rounded-xl px-3" onClick={()=>setPage(page-1)}>Sebelumnya</button><span>Halaman {page} / {Math.max(1,Math.ceil(total/20))} · {total} rute</span><button disabled={page*20>=total||loading} className="min-h-11 border rounded-xl px-3" onClick={()=>setPage(page+1)}>Berikutnya</button></div>
      {loading ? <div className="text-center py-12 text-on-surface-variant text-sm">Memuat data...</div> : routes.length === 0 ? <div className="text-center py-12 bg-surface border border-border-glass rounded-2xl">
          <LuNavigation className="mx-auto text-3xl text-on-surface-variant/50 mb-2" />
          <p className="text-sm text-on-surface-variant">Belum ada rute pengiriman</p>
        </div> : <div className="space-y-3">
          {routes.map(route => <section key={route.id} className="space-y-2"><RouteCard route={route} onStatusUpdate={handleStatusUpdate} onDelete={handleDelete} /><RouteOperationsActions route={route} onChanged={fetchRoutes}/></section>)}
        </div>}
    </div>;
};
