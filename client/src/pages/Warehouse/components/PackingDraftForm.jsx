import { PackingOutletSection } from './PackingOutletSection';
import { PackingItemsSection } from './PackingItemsSection';
import { PackingInvoicesSection } from './PackingInvoicesSection';
import React, { useEffect, useState } from 'react';
import { deliveryApi, outletsApi } from '../../../services/api';
import { BusinessCodeInput } from '../../../shared/components/common/BusinessCodeInput';
import { LuCircleAlert, LuRefreshCw, LuPackage, LuX } from 'react-icons/lu';
export function PackingDraftForm({
  document: doc,
  order,
  onSaved,
  onCancel
}) {
  const [code, setCode] = useState(doc?.code || '');
  const [outlet, setOutlet] = useState(doc?.outlet || order?.pjpStop?.outlet || null);
  const [search, setSearch] = useState('');
  const [outlets, setOutlets] = useState([]);
  const [searchingOutlets, setSearchingOutlets] = useState(false);
  const [items, setItems] = useState(doc?.items || order?.items?.map(i => ({
    lineId: i.id,
    sku: i.product?.sku || '',
    name: i.product?.name || '',
    quantity: i.quantity,
    unit: 'unit'
  })) || [{
    name: '',
    sku: '',
    unit: 'unit',
    quantity: 1
  }]);
  const [invoices, setInvoices] = useState(doc?.invoices?.map(({
    invoiceNumber,
    totalCartons,
    totalAmount
  }) => ({
    invoiceNumber,
    totalCartons,
    totalAmount
  })) || []);
  const [cartons, setCartons] = useState(doc?.totalCartons || 0);
  const [weight, setWeight] = useState(doc?.totalWeight || 0);
  const [notes, setNotes] = useState(doc?.notes || '');
  const [reason, setReason] = useState(doc?.overrideReason || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Outlet search debounce
  useEffect(() => {
    if (search.trim().length < 2) {
      setOutlets([]);
      return;
    }
    let active = true;
    setSearchingOutlets(true);
    const timer = setTimeout(() => {
      outletsApi.getAll({
        search,
        limit: 15
      }).then(r => {
        if (active) {
          const d = r.data;
          setOutlets(Array.isArray(d) ? d : d?.data || d?.outlets || []);
        }
      }).catch(e => {
        if (active) setError(e.message || 'Gagal mencari outlet');
      }).finally(() => {
        if (active) setSearchingOutlets(false);
      });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);
  const sourceOrderId = doc?.sourceOrderId || order?.id || null;

  // Real-time carton match calculation
  const totalCartonsNum = Number(cartons) || 0;
  const totalInvoiceCartons = invoices.reduce((sum, inv) => sum + (Number(inv.totalCartons) || 0), 0);
  const isCartonBalanced = totalCartonsNum > 0 && totalInvoiceCartons === totalCartonsNum;
  const save = async e => {
    e.preventDefault();
    if (busy) return;
    if (!outlet) {
      setError('Pilih outlet / toko tujuan terlebih dahulu.');
      return;
    }
    if (items.length === 0) {
      setError('Minimal sertakan 1 baris barang produk.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = {
        code,
        outletId: outlet.id,
        sourceOrderId,
        items,
        invoices: invoices.map(i => ({
          ...i,
          totalAmount: i.totalAmount === '' || i.totalAmount == null ? undefined : Number(i.totalAmount)
        })),
        totalCartons: Number(cartons),
        totalWeight: Number(weight),
        notes,
        overrideReason: reason,
        ...(doc ? {
          revision: doc.revision
        } : {})
      };
      if (doc) {
        await deliveryApi.updatePackingList(doc.id, data);
      } else {
        await deliveryApi.createPackingList(data);
      }
      onSaved(doc ? 'Draft packing list berhasil diperbarui!' : 'Draft packing list berhasil dibuat!');
    } catch (e) {
      setError(e.message || 'Gagal menyimpan draft packing list');
    } finally {
      setBusy(false);
    }
  };
  const addItem = () => {
    setItems(prev => [...prev, {
      name: '',
      sku: '',
      unit: 'unit',
      quantity: 1
    }]);
  };
  const removeItem = index => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };
  const addInvoice = () => {
    setInvoices(prev => [...prev, {
      invoiceNumber: '',
      totalCartons: 1,
      totalAmount: ''
    }]);
  };
  const removeInvoice = index => {
    setInvoices(prev => prev.filter((_, i) => i !== index));
  };
  return <form onSubmit={save} className="rounded-2xl border border-primary/30 bg-surface p-5 md:p-6 space-y-6 shadow-md text-on-surface animate-fade-in">
      {/* Form Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-glass pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <LuPackage className="text-lg" />
            </span>
            <h2 className="text-lg font-black tracking-tight text-on-surface">
              {doc ? `Edit Dokumen: ${doc.code}` : 'Buat Draft Packing List Admin'}
            </h2>
          </div>
          <p className="text-xs text-on-surface-variant">
            {sourceOrderId ? `Terhubung dengan referensi pesanan sales (${sourceOrderId.slice(0, 8)}...)` : 'Penyusunan dokumen muatan manual tanpa keterikatan order sales.'}
          </p>
        </div>

        <button type="button" onClick={onCancel} disabled={busy} className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all" title="Tutup form">
          <LuX className="text-lg" />
        </button>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-2">
          <LuCircleAlert className="text-sm shrink-0" />
          <span>{error}</span>
        </div>}

      <fieldset disabled={busy} className="space-y-6">
        <BusinessCodeInput entity="PACKING_LIST" value={code} onChange={setCode} existing={Boolean(doc)} />
        {/* ── Outlet Selection Section ── */}
        <PackingOutletSection doc={doc} outlet={outlet} outlets={outlets} search={search} searchingOutlets={searchingOutlets} setOutlet={setOutlet} setOutlets={setOutlets} setSearch={setSearch} sourceOrderId={sourceOrderId} />

        {/* ── Items List Section ── */}
        <PackingItemsSection addItem={addItem} items={items} removeItem={removeItem} setItems={setItems} />

        {/* ── Cartons & Weight Summary ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container/40 border border-border-glass">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Total Fisik Karton / Kemasan Luar *
            </label>
            <input type="number" min="0" step="1" required value={cartons} onChange={e => setCartons(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-sm font-black text-on-surface" />
            <span className="text-[10px] text-on-surface-variant mt-1 block">
              Jumlah kemasan karton fisik untuk alokasi kapasitas kendaraan.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Estimasi Berat Total (Kg)
            </label>
            <input type="number" min="0" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-sm font-bold text-on-surface" />
            <span className="text-[10px] text-on-surface-variant mt-1 block">
              Opsional, untuk perhitungan beban tonase kendaraan pengiriman.
            </span>
          </div>
        </div>

        {/* ── Invoices Section ── */}
        <PackingInvoicesSection addInvoice={addInvoice} doc={doc} invoices={invoices} isCartonBalanced={isCartonBalanced} removeInvoice={removeInvoice} setInvoices={setInvoices} totalCartonsNum={totalCartonsNum} totalInvoiceCartons={totalInvoiceCartons} />

        {/* ── Additional Notes & Reason ── */}
        <div className="space-y-3">
          {sourceOrderId && <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Alasan Override Admin (Wajib jika status order belum di-approve)
              </label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Catatan justifikasi override pembuatan packing list dari order pending..." rows={2} className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs text-on-surface resize-none" />
            </div>}

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Catatan Instruksi Pengiriman / Khusus Gudang
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instruksi tambahan untuk tim gudang atau supir (misal: titip faktur asli, simpan di tempat sejuk)..." rows={2} className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs text-on-surface resize-none" />
          </div>
        </div>

        {/* ── Form Actions ── */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-glass">
          <button type="button" disabled={busy} onClick={onCancel} className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container transition-all">
            Batal
          </button>
          <button type="submit" disabled={busy || !outlet} className="px-6 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer">
            <LuRefreshCw className={`text-xs ${busy ? 'animate-spin' : ''}`} />
            <span>{busy ? 'Menyimpan Dokumen…' : doc ? 'Simpan Perubahan' : 'Simpan Draft Packing List'}</span>
          </button>
        </div>
      </fieldset>
    </form>;
}
