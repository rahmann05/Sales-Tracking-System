import React, { useEffect, useState } from 'react';
import { deliveryApi, outletsApi } from '../../../services/api';
import {
  LuStore,
  LuPlus,
  LuTrash2,
  LuCheck,
  LuTriangleAlert,
  LuCircleAlert,
  LuCircleCheck,
  LuRefreshCw,
  LuPackage,
  LuFileText,
  LuSearch,
  LuX,
  LuInfo,
} from 'react-icons/lu';

export function PackingDraftForm({ document: doc, order, onSaved, onCancel }) {
  const [outlet, setOutlet] = useState(doc?.outlet || order?.pjpStop?.outlet || null);
  const [search, setSearch] = useState('');
  const [outlets, setOutlets] = useState([]);
  const [searchingOutlets, setSearchingOutlets] = useState(false);

  const [items, setItems] = useState(
    doc?.items ||
      order?.items?.map((i) => ({
        lineId: i.id,
        sku: i.product?.sku || '',
        name: i.product?.name || '',
        quantity: i.quantity,
        unit: 'unit',
      })) ||
      [{ name: '', sku: '', unit: 'unit', quantity: 1 }]
  );

  const [invoices, setInvoices] = useState(
    doc?.invoices?.map(({ invoiceNumber, totalCartons, totalAmount }) => ({
      invoiceNumber,
      totalCartons,
      totalAmount,
    })) || []
  );

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
      outletsApi
        .getAll({ search, limit: 15 })
        .then((r) => {
          if (active) {
            const d = r.data;
            setOutlets(Array.isArray(d) ? d : d?.data || d?.outlets || []);
          }
        })
        .catch((e) => {
          if (active) setError(e.message || 'Gagal mencari outlet');
        })
        .finally(() => {
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

  const save = async (e) => {
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
        outletId: outlet.id,
        sourceOrderId,
        items,
        invoices: invoices.map((i) => ({
          ...i,
          totalAmount: i.totalAmount === '' || i.totalAmount == null ? undefined : Number(i.totalAmount),
        })),
        totalCartons: Number(cartons),
        totalWeight: Number(weight),
        notes,
        overrideReason: reason,
        ...(doc ? { revision: doc.revision } : {}),
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
    setItems((prev) => [...prev, { name: '', sku: '', unit: 'unit', quantity: 1 }]);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addInvoice = () => {
    setInvoices((prev) => [...prev, { invoiceNumber: '', totalCartons: 1, totalAmount: '' }]);
  };

  const removeInvoice = (index) => {
    setInvoices((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form
      onSubmit={save}
      className="rounded-2xl border border-primary/30 bg-surface p-5 md:p-6 space-y-6 shadow-md text-on-surface animate-fade-in"
    >
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
            {sourceOrderId
              ? `Terhubung dengan referensi pesanan sales (${sourceOrderId.slice(0, 8)}...)`
              : 'Penyusunan dokumen muatan manual tanpa keterikatan order sales.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all"
          title="Tutup form"
        >
          <LuX className="text-lg" />
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-2">
          <LuCircleAlert className="text-sm shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <fieldset disabled={busy} className="space-y-6">
        {/* ── Outlet Selection Section ── */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
            <LuStore className="text-primary text-sm" />
            <span>Toko / Outlet Tujuan</span>
          </label>

          {outlet ? (
            <div className="p-3.5 rounded-xl bg-surface-container/60 border border-border-glass flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <strong className="text-sm text-on-surface font-black">{outlet.name}</strong>
                  {outlet.outletCode && (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface border border-border-glass font-bold">
                      {outlet.outletCode}
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-1">
                  {outlet.address || 'Alamat tidak tersedia'}
                </p>
              </div>

              {!sourceOrderId && !doc && (
                <button
                  type="button"
                  onClick={() => setOutlet(null)}
                  className="px-3 py-1.5 rounded-lg border border-border-glass hover:bg-surface text-xs font-bold text-primary transition-all shrink-0"
                >
                  Ganti Toko
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2 relative">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ketik minimal 2 huruf nama atau kode toko..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-container/40 border border-border-glass text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {searchingOutlets && (
                  <LuRefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 text-primary text-xs animate-spin" />
                )}
              </div>

              {outlets.length > 0 && (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-border-glass bg-surface shadow-lg divide-y divide-border-glass">
                  {outlets.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setOutlet(o);
                        setSearch('');
                        setOutlets([]);
                      }}
                      className="w-full p-2.5 text-left hover:bg-surface-container flex flex-col gap-0.5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-on-surface">{o.name}</span>
                        <span className="text-[10px] font-mono text-on-surface-variant">{o.outletCode}</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant truncate">{o.address}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Items List Section ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <LuPackage className="text-primary text-sm" />
                <span>Rincian Barang Muatan</span>
              </label>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-[11px] font-bold text-on-surface">
                {items.length} Barang
              </span>
            </div>

            <button
              type="button"
              onClick={addItem}
              className="px-3 py-1.5 rounded-xl border border-border-glass hover:bg-surface-container text-xs font-bold text-primary flex items-center gap-1.5 transition-all shadow-xs"
            >
              <LuPlus className="text-sm" />
              <span>Tambah Barang</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {items.map((item, index) => (
              <div
                key={item.lineId || index}
                className="p-3 rounded-xl bg-surface-container/30 border border-border-glass grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
              >
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                    SKU / Kode
                  </label>
                  <input
                    type="text"
                    value={item.sku}
                    onChange={(e) =>
                      setItems(items.map((v, i) => (i === index ? { ...v, sku: e.target.value } : v)))
                    }
                    placeholder="Contoh: SKU-001"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border-glass text-xs font-mono text-on-surface"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                    Nama Barang *
                  </label>
                  <input
                    type="text"
                    required
                    value={item.name}
                    onChange={(e) =>
                      setItems(items.map((v, i) => (i === index ? { ...v, name: e.target.value } : v)))
                    }
                    placeholder="Nama produk"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border-glass text-xs font-bold text-on-surface"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                    Jumlah *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) =>
                      setItems(
                        items.map((v, i) =>
                          i === index ? { ...v, quantity: Math.max(1, Number(e.target.value)) } : v
                        )
                      )
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border-glass text-xs font-bold text-on-surface text-right"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                    Satuan *
                  </label>
                  <input
                    type="text"
                    required
                    value={item.unit}
                    onChange={(e) =>
                      setItems(items.map((v, i) => (i === index ? { ...v, unit: e.target.value } : v)))
                    }
                    placeholder="pcs / karton"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border-glass text-xs text-on-surface"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-center pb-0.5">
                  <button
                    type="button"
                    disabled={items.length <= 1}
                    onClick={() => removeItem(index)}
                    className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-all cursor-pointer"
                    title="Hapus baris barang ini"
                  >
                    <LuTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Cartons & Weight Summary ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container/40 border border-border-glass">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Total Fisik Karton / Kemasan Luar *
            </label>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={cartons}
              onChange={(e) => setCartons(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-sm font-black text-on-surface"
            />
            <span className="text-[10px] text-on-surface-variant mt-1 block">
              Jumlah kemasan karton fisik untuk alokasi kapasitas kendaraan.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Estimasi Berat Total (Kg)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-sm font-bold text-on-surface"
            />
            <span className="text-[10px] text-on-surface-variant mt-1 block">
              Opsional, untuk perhitungan beban tonase kendaraan pengiriman.
            </span>
          </div>
        </div>

        {/* ── Invoices Section ── */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <LuFileText className="text-primary text-sm" />
                <span>Faktur Penjualan Terlampir</span>
              </label>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-[11px] font-bold text-on-surface">
                {invoices.length} Faktur
              </span>
            </div>

            <button
              type="button"
              onClick={addInvoice}
              className="px-3 py-1.5 rounded-xl border border-border-glass hover:bg-surface-container text-xs font-bold text-primary flex items-center gap-1.5 transition-all shadow-xs"
            >
              <LuPlus className="text-sm" />
              <span>Tambah Faktur</span>
            </button>
          </div>

          {/* Validation Balance Indicator */}
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
              isCartonBalanced
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            {isCartonBalanced ? (
              <LuCircleCheck className="text-emerald-600 dark:text-emerald-400 text-sm shrink-0" />
            ) : (
              <LuTriangleAlert className="text-amber-600 dark:text-amber-400 text-sm shrink-0" />
            )}
            <span className="font-semibold">
              {isCartonBalanced
                ? `Total karton faktur (${totalInvoiceCartons}) seimbang dengan total karton dokumen (${totalCartonsNum}). Dokumen siap dilepas ke gudang.`
                : `Total karton faktur (${totalInvoiceCartons}) belum sama dengan total karton dokumen (${totalCartonsNum}). Syarat rilis gudang memerlukan kesamaan karton.`}
            </span>
          </div>

          {invoices.length > 0 && (
            <div className="space-y-2">
              {invoices.map((inv, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-surface-container/30 border border-border-glass grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                >
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                      Nomor Faktur *
                    </label>
                    <input
                      type="text"
                      required
                      value={inv.invoiceNumber}
                      onChange={(e) =>
                        setInvoices(
                          invoices.map((v, i) => (i === index ? { ...v, invoiceNumber: e.target.value } : v))
                        )
                      }
                      placeholder="Contoh: INV-2026-0012"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border-glass text-xs font-mono font-bold text-on-surface"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                      Karton Faktur *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={inv.totalCartons}
                      onChange={(e) =>
                        setInvoices(
                          invoices.map((v, i) =>
                            i === index ? { ...v, totalCartons: Number(e.target.value) } : v
                          )
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border-glass text-xs font-bold text-on-surface text-right"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                      Nominal Rp (Opsional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={inv.totalAmount ?? ''}
                      onChange={(e) =>
                        setInvoices(
                          invoices.map((v, i) => (i === index ? { ...v, totalAmount: e.target.value } : v))
                        )
                      }
                      placeholder="Nominal rupiah"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border-glass text-xs font-mono text-on-surface text-right"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-center pb-0.5">
                    <button
                      type="button"
                      onClick={() => removeInvoice(index)}
                      className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      title="Hapus faktur ini"
                    >
                      <LuTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Additional Notes & Reason ── */}
        <div className="space-y-3">
          {sourceOrderId && (
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Alasan Override Admin (Wajib jika status order belum di-approve)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Catatan justifikasi override pembuatan packing list dari order pending..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs text-on-surface resize-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Catatan Instruksi Pengiriman / Khusus Gudang
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruksi tambahan untuk tim gudang atau supir (misal: titip faktur asli, simpan di tempat sejuk)..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs text-on-surface resize-none"
            />
          </div>
        </div>

        {/* ── Form Actions ── */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-glass">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={busy || !outlet}
            className="px-6 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <LuRefreshCw className={`text-xs ${busy ? 'animate-spin' : ''}`} />
            <span>{busy ? 'Menyimpan Dokumen…' : doc ? 'Simpan Perubahan' : 'Simpan Draft Packing List'}</span>
          </button>
        </div>
      </fieldset>
    </form>
  );
}
