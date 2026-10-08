import { PackingAllocationFields } from './PackingAllocationFields';
import { BusinessCodeInput } from '../../../shared/components/common/BusinessCodeInput';
import { useApp } from '../../../context/AppContext';
import { calculateFuelCost, evaluateDropProfitability } from '../../../services/logisticsOptimizerService';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
import React, { useState, useEffect } from 'react';
import { deliveryApi, vehiclesApi } from '../../../services/api';

import { LuPlus, LuPackage, LuX, LuArrowUp, LuArrowDown } from "react-icons/lu";
import { FiAlertTriangle } from 'react-icons/fi';
export const CreateRouteForm = ({
  onCreated,
  onCancel
}) => {
  const [code, setCode] = useState('');
  const {
    settings
  } = useApp();
  const [estimatedKm, setEstimatedKm] = useState('');
  const [date, setDate] = useState(() => wibDateKey());
  const [startTime,setStartTime]=useState('08:00');
  const [endTime,setEndTime]=useState('17:00');
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
        const [vRes, dRes, plRes] = await Promise.all([vehiclesApi.getAll(), deliveryApi.getDrivers(), (async () => {
          let page = 1;
          const items = [];
          let result;
          do {
            result = await deliveryApi.getPackingLists({
              limit: 100,
              page,
              status: 'RELEASED'
            });
            items.push(...result.data.items);
            page++;
          } while (items.length < result.data.total);
          return {
            success: true,
            data: {
              items
            }
          };
        })()]);
        if (Array.isArray(vRes.data)) setVehicles(vRes.data);
        if (dRes.success) setDrivers(dRes.data || []);
        if (plRes.success) setPackingLists(plRes.data.items || []);
      } catch (err) {
        console.error('Error loading form data:', err);
      }
    };
    fetchData();
  }, []);
  const addPackingList = pl => {
    if (selectedPLs.find(s => s.packingListId === pl.id)) return;
    setSelectedPLs([...selectedPLs, {
      packingListId: pl.id,
      outletId: pl.outletId,
      outletName: pl.outlet?.name || '-',
      code: pl.code,
      totalCartons: pl.remainingCartons,
      remainingCartons: pl.remainingCartons,
      invoices: (pl.remainingInvoices||[]).filter(i=>i.remaining>0).map(i=>({...i,cartons:i.remaining})),
      items: pl.remainingItems.filter(i => i.remaining > 0).map(i => ({
        ...i,
        quantity: i.remaining
      }))
    }]);
  };
  const removePackingList = plId => {
    setSelectedPLs(selectedPLs.filter(s => s.packingListId !== plId));
  };
  const moveStop = (idx, direction) => {
    const newList = [...selectedPLs];
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= newList.length) return;
    [newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]];
    setSelectedPLs(newList);
  };
  const totalCartons = selectedPLs.reduce((sum, s) => sum + (s.totalCartons || 0), 0);
  const selectedVehicleObj = vehicles.find(v => v.id === selectedVehicle);
  const overCapacity = selectedVehicleObj && totalCartons > selectedVehicleObj.maxCartons;
  const fuelEstimate = calculateFuelCost(Number(estimatedKm) || 0, selectedVehicleObj);
  const marginEstimate = evaluateDropProfitability({
    cartonCount: totalCartons,
    pricePerCarton: settings.LOGISTICS_PRICE_PER_CARTON,
    grossMarginPercent: settings.LOGISTICS_MARGIN_PERCENT,
    estimatedDropCost: selectedPLs.length * settings.LOGISTICS_BASE_DROP_COST + fuelEstimate.totalCost
  });
  const handleSubmit = async () => {
    if (submitting) return;
    if (overCapacity) return alert('Muatan melebihi kapasitas kendaraan. Kurangi packing list atau pilih kendaraan lain.');
    if (!selectedVehicle) return alert('Pilih kendaraan');
    if (!selectedDriver) return alert('Pilih supir');
    if (selectedPLs.length === 0) return alert('Tambahkan minimal 1 packing list');
    setSubmitting(true);
    try {
      await deliveryApi.createDeliveryRoute({
        code,
        ...(estimatedKm !== '' ? {
          totalDistanceKm: Number(estimatedKm)
        } : {}),
        date,
        plannedStartAt: new Date(`${date}T${startTime}:00+07:00`).toISOString(),
        plannedEndAt: new Date(`${date}T${endTime}:00+07:00`).toISOString(),
        vehicleId: selectedVehicle,
        driverId: selectedDriver,
        notes: notes || undefined,
        stops: selectedPLs.map((s, idx) => ({
          packingListId: s.packingListId,
          outletId: s.outletId,
          sequence: idx + 1,
          allocatedCartons: s.totalCartons,
          allocatedInvoices: s.invoices.filter(i=>i.cartons>0).map(i=>({invoiceId:i.id,cartons:i.cartons})),
          allocatedItems: s.items.filter(i => i.quantity > 0).map(i => ({
            lineId: i.lineId,
            quantity: i.quantity
          }))
        }))
      });
      onCreated();
    } catch (err) {
      alert(err.message || 'Gagal membuat rute');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter out packing lists that are already assigned to a route
  const availablePLs = packingLists.filter(pl => pl.remainingCartons > 0 && !selectedPLs.find(s => s.packingListId === pl.id));
  return <div className="bg-surface border border-primary/20 rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-on-surface">Buat Rute Pengiriman Baru</h3>
      <BusinessCodeInput entity="DELIVERY_ROUTE" value={code} onChange={setCode} disabled={submitting} />
      <div className="grid grid-cols-2 gap-3"><label>Berangkat WIB<input className="form-input block w-full" type="time" required value={startTime} onChange={e=>setStartTime(e.target.value)}/></label><label>Target kembali WIB<input className="form-input block w-full" type="time" required value={endTime} onChange={e=>setEndTime(e.target.value)}/></label></div>
      <p className="text-sm text-on-surface-variant">Pilih kendaraan dan supir, tambahkan packing list, lalu simpan sebagai draft. Konfirmasi penyiapan, pemeriksaan, dan serah terima muatan sebelum berangkat.</p>
      <section className="rounded-xl border border-border-glass bg-surface-container p-4 space-y-3">
        <label className="block text-sm">Estimasi jarak perjalanan (km, opsional)<input type="number" min="0" step="0.1" className="form-input mt-1 w-full" value={estimatedKm} onChange={e => setEstimatedKm(e.target.value)} placeholder="Masukkan estimasi jarak" /></label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <p>Muatan: <strong>{totalCartons} karton</strong></p>
          <p>Estimasi BBM: <strong>{estimatedKm !== '' && selectedVehicleObj ? `Rp ${fuelEstimate.totalCost.toLocaleString('id-ID')}` : 'Belum dihitung'}</strong></p>
          <p>Estimasi margin: <strong>{settings.LOGISTICS_PRICE_PER_CARTON > 0 && settings.LOGISTICS_MARGIN_PERCENT > 0 ? `Rp ${marginEstimate.netMargin.toLocaleString('id-ID')}` : 'Parameter belum diisi admin'}</strong></p>
        </div>
        <p className="text-xs text-on-surface-variant">Estimasi memakai spesifikasi kendaraan serta nilai karton, margin, dan biaya per titik dari pengaturan admin.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Date */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1">Tanggal</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        {/* Vehicle */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1">Kendaraan</label>
          <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Pilih kendaraan...</option>
            {vehicles.filter(v => v.isActive && v.condition==='AVAILABLE').map(v => <option key={v.id} value={v.id}>{v.name} ({v.code}) — Maks {v.maxCartons} krt</option>)}
          </select>
        </div>

        {/* Driver */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-1">Supir</label>
          <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Pilih supir...</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Available Packing Lists */}
      <div>
        <label className="text-xs font-semibold text-on-surface-variant block mb-2">Packing List Tersedia</label>
        {availablePLs.length === 0 ? <p className="text-xs text-on-surface-variant">Tidak ada packing list yang tersedia</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {availablePLs.map(pl => <button key={pl.id} onClick={() => addPackingList(pl)} className="flex items-center gap-2 text-left p-2.5 rounded-xl border border-border-glass hover:border-primary/40 hover:bg-primary/5 transition-all">
                <LuPackage className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-on-surface min-w-0 whitespace-normal break-words">{pl.code} • {pl.outlet?.name}</div>
                  <div className="text-[10px] text-on-surface-variant">{pl.totalCartons} Karton • {pl.invoices?.length} Faktur</div>
                </div>
                <LuPlus className="text-primary shrink-0" />
              </button>)}
          </div>}
      </div>

      {/* Selected Stops (Reorderable) */}
      {selectedPLs.length > 0 && <div>
          <label className="text-xs font-semibold text-on-surface-variant block mb-2">
            Urutan Toko di Rute ({selectedPLs.length} toko)
          </label>
          <div className="space-y-2">
            {selectedPLs.map((s, idx) => <div key={s.packingListId} className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-on-surface min-w-0 whitespace-normal break-words">{s.outletName}</div>
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
                <PackingAllocationFields entry={s} allowSplit={settings.PACKING_ALLOW_SPLIT} onChange={updated => setSelectedPLs(selectedPLs.map(v => v.packingListId === updated.packingListId ? updated : v))} />
              </div>)}
          </div>
        </div>}

      {/* Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`px-4 py-2 rounded-xl text-sm font-bold ${overCapacity ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary'}`}>
          Total: {totalCartons} Karton
          {selectedVehicleObj && ` / ${selectedVehicleObj.maxCartons} Maks`}
        </div>
        {overCapacity && <span className="flex items-center gap-1 text-xs text-red-600 font-semibold"><FiAlertTriangle /> Melebihi kapasitas kendaraan!</span>}
      </div>

      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan (opsional)" rows={2} className="w-full px-3 py-2 rounded-xl border border-border-glass bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-border-glass hover:bg-surface-variant transition-colors">
          Batal
        </button>
        <button onClick={handleSubmit} disabled={submitting || overCapacity || selectedPLs.length === 0 || !selectedVehicle || !selectedDriver} className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
          {submitting ? 'Menyimpan...' : 'Simpan Rute'}
        </button>
      </div>
    </div>;
};
