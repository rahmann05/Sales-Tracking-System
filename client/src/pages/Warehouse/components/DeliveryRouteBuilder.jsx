import React, { useState, useEffect, useCallback } from 'react';
import { deliveryApi } from '../../../services/api';
import { vehiclesApi } from '../../../services/api';
import { LuNavigation, LuPlus, LuTrash2, LuSearch, LuTruck, LuUser, LuPackage, LuX, LuArrowUp, LuArrowDown, LuCheck } from 'react-icons/lu';
import { FiAlertTriangle } from 'react-icons/fi';

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: '#6b7280', bg: '#f3f4f6', action: 'Siap Kirim', nextStatus: 'READY' },
  READY: { label: 'Siap Kirim', color: '#2563eb', bg: '#dbeafe', action: 'Mulai Kirim', nextStatus: 'IN_TRANSIT' },
  IN_TRANSIT: { label: 'Dalam Perjalanan', color: '#d97706', bg: '#fef3c7', action: null, nextStatus: null },
  COMPLETED: { label: 'Selesai', color: '#16a34a', bg: '#dcfce7', action: null, nextStatus: null },
  PARTIAL: { label: 'Sebagian', color: '#dc2626', bg: '#fee2e2', action: null, nextStatus: null },
};

/**
 * DeliveryRouteBuilder — Create and manage delivery routes for Kepala Gudang.
 */
export const DeliveryRouteBuilder = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryApi.getDeliveryRoutes({ limit: 50 });
      if (res.success) setRoutes(res.data.items || []);
    } catch (err) {
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleDelete = async (id) => {
    if (!confirm('Hapus rute ini?')) return;
    try {
      await deliveryApi.deleteDeliveryRoute(id);
      fetchRoutes();
    } catch (err) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto pb-16 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <LuNavigation className="text-primary" />
            Kelola Rute Pengiriman
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Buat rute, tetapkan kendaraan & supir, atur urutan toko</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
        >
          {showCreateForm ? <LuX /> : <LuPlus />}
          {showCreateForm ? 'Batal' : 'Buat Rute Baru'}
        </button>
      </div>

      {showCreateForm && (
        <CreateRouteForm
          onCreated={() => { setShowCreateForm(false); fetchRoutes(); }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Route List */}
      {loading ? (
        <div className="text-center py-12 text-on-surface-variant text-sm">Memuat data...</div>
      ) : routes.length === 0 ? (
        <div className="text-center py-12 bg-surface border border-border-glass rounded-2xl">
          <LuNavigation className="mx-auto text-3xl text-on-surface-variant/50 mb-2" />
          <p className="text-sm text-on-surface-variant">Belum ada rute pengiriman</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onStatusUpdate={handleStatusUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const RouteCard = ({ route, onStatusUpdate, onDelete }) => {
  const cfg = STATUS_CONFIG[route.status] || {};
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-surface border border-border-glass rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-variant/30" onClick={() => setExpanded(!expanded)}>
        <div className="p-2 rounded-xl bg-primary/10 shrink-0">
          <LuTruck className="text-lg text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-on-surface">{route.code}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{cfg.label}</span>
          </div>
          <div className="text-xs text-on-surface-variant mt-0.5">
            {route.vehicle?.name} • {route.driver?.name} • {new Date(route.date).toLocaleDateString('id-ID')} • {route.totalCartons} Karton • {route.stops?.length || 0} Toko
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {cfg.action && (
            <button
              onClick={(e) => { e.stopPropagation(); onStatusUpdate(route.id, cfg.nextStatus); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ backgroundColor: cfg.nextStatus === 'READY' ? '#2563eb' : '#d97706' }}
            >
              <LuCheck className="inline mr-1" />{cfg.action}
            </button>
          )}
          {route.status === 'DRAFT' && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(route.id); }}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              <LuTrash2 className="text-sm" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-border-glass pt-3">
          {route.stops?.map((stop, idx) => (
            <div key={stop.id || idx} className="flex items-center gap-3 text-xs py-2 px-3 rounded-lg bg-surface-variant/30">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-on-surface truncate">{stop.outlet?.name}</div>
                <div className="text-on-surface-variant truncate">{stop.outlet?.address}</div>
              </div>
              <span className="text-on-surface-variant shrink-0">{stop.packingList?.code}</span>
              <span className="font-semibold text-on-surface shrink-0">{stop.packingList?.totalCartons || 0} krt</span>
            </div>
          ))}
          {route.notes && (
            <div className="text-xs text-on-surface-variant bg-surface-variant/20 rounded-lg p-2 mt-2">
              Catatan: {route.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CreateRouteForm = ({ onCreated, onCancel }) => {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [packingLists, setPackingLists] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedPLs, setSelectedPLs] = useState([]); // Array of { packingListId, outletId, outletName, totalCartons }
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vRes, dRes, plRes] = await Promise.all([
          vehiclesApi.getAll(),
          deliveryApi.getDrivers(),
          deliveryApi.getPackingLists({ limit: 100 }),
        ]);
        if (vRes.success) setVehicles(vRes.data || []);
        if (dRes.success) setDrivers(dRes.data || []);
        if (plRes.success) setPackingLists(plRes.data.items || []);
      } catch (err) {
        console.error('Error loading form data:', err);
      }
    };
    fetchData();
  }, []);

  const addPackingList = (pl) => {
    if (selectedPLs.find((s) => s.packingListId === pl.id)) return;
    setSelectedPLs([...selectedPLs, {
      packingListId: pl.id,
      outletId: pl.outletId,
      outletName: pl.outlet?.name || '-',
      code: pl.code,
      totalCartons: pl.totalCartons,
    }]);
  };

  const removePackingList = (plId) => {
    setSelectedPLs(selectedPLs.filter((s) => s.packingListId !== plId));
  };

  const moveStop = (idx, direction) => {
    const newList = [...selectedPLs];
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= newList.length) return;
    [newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]];
    setSelectedPLs(newList);
  };

  const totalCartons = selectedPLs.reduce((sum, s) => sum + (s.totalCartons || 0), 0);
  const selectedVehicleObj = vehicles.find((v) => v.id === selectedVehicle);
  const overCapacity = selectedVehicleObj && totalCartons > selectedVehicleObj.maxCartons;

  const handleSubmit = async () => {
    if (!selectedVehicle) return alert('Pilih kendaraan');
    if (!selectedDriver) return alert('Pilih supir');
    if (selectedPLs.length === 0) return alert('Tambahkan minimal 1 packing list');

    setSubmitting(true);
    try {
      await deliveryApi.createDeliveryRoute({
        date,
        vehicleId: selectedVehicle,
        driverId: selectedDriver,
        notes: notes || undefined,
        stops: selectedPLs.map((s, idx) => ({
          packingListId: s.packingListId,
          outletId: s.outletId,
          sequence: idx + 1,
        })),
      });
      onCreated();
    } catch (err) {
      alert(err.message || 'Gagal membuat rute');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter out packing lists that are already assigned to a route
  const availablePLs = packingLists.filter(
    (pl) => !pl.deliveryStops?.length && !selectedPLs.find((s) => s.packingListId === pl.id)
  );

  return (
    <div className="bg-surface border border-primary/20 rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-on-surface">Buat Rute Pengiriman Baru</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Date */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Vehicle */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1">Kendaraan</label>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Pilih kendaraan...</option>
            {vehicles.filter((v) => v.isActive).map((v) => (
              <option key={v.id} value={v.id}>{v.name} ({v.code}) — Maks {v.maxCartons} krt</option>
            ))}
          </select>
        </div>

        {/* Driver */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1">Supir</label>
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Pilih supir...</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Available Packing Lists */}
      <div>
        <label className="text-xs font-semibold text-on-surface-variant block mb-2">Packing List Tersedia</label>
        {availablePLs.length === 0 ? (
          <p className="text-xs text-on-surface-variant">Tidak ada packing list yang tersedia</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {availablePLs.map((pl) => (
              <button
                key={pl.id}
                onClick={() => addPackingList(pl)}
                className="flex items-center gap-2 text-left p-2.5 rounded-xl border border-border-glass hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <LuPackage className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-on-surface truncate">{pl.code} • {pl.outlet?.name}</div>
                  <div className="text-[10px] text-on-surface-variant">{pl.totalCartons} Karton • {pl.invoices?.length} Faktur</div>
                </div>
                <LuPlus className="text-primary shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Stops (Reorderable) */}
      {selectedPLs.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-2">
            Urutan Toko di Rute ({selectedPLs.length} toko)
          </label>
          <div className="space-y-2">
            {selectedPLs.map((s, idx) => (
              <div key={s.packingListId} className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-on-surface truncate">{s.outletName}</div>
                  <div className="text-[10px] text-on-surface-variant">{s.code} • {s.totalCartons} krt</div>
                </div>
                <button onClick={() => moveStop(idx, -1)} disabled={idx === 0} className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30">
                  <LuArrowUp className="text-sm" />
                </button>
                <button onClick={() => moveStop(idx, 1)} disabled={idx === selectedPLs.length - 1} className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30">
                  <LuArrowDown className="text-sm" />
                </button>
                <button onClick={() => removePackingList(s.packingListId)} className="p-1 rounded text-red-500 hover:bg-red-50">
                  <LuX className="text-sm" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`px-4 py-2 rounded-xl text-sm font-bold ${overCapacity ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary'}`}>
          Total: {totalCartons} Karton
          {selectedVehicleObj && ` / ${selectedVehicleObj.maxCartons} Maks`}
        </div>
        {overCapacity && (
          <span className="flex items-center gap-1 text-xs text-red-600 font-semibold"><FiAlertTriangle /> Melebihi kapasitas kendaraan!</span>
        )}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Catatan (opsional)"
        rows={2}
        className="w-full px-3 py-2 rounded-xl border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-border-glass hover:bg-surface-variant transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || overCapacity || selectedPLs.length === 0 || !selectedVehicle || !selectedDriver}
          className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitting ? 'Menyimpan...' : 'Simpan Rute'}
        </button>
      </div>
    </div>
  );
};
