import React from 'react';
import { LuCircleAlert, LuPackage, LuRefreshCw, LuX } from 'react-icons/lu';
import { BusinessCodeInput } from '../../../shared/components/common/BusinessCodeInput';
import { PackingInvoicesSection } from './PackingInvoicesSection';
import { PackingItemsSection } from './PackingItemsSection';
import { PackingOutletSection } from './PackingOutletSection';
import { useLegacyPackingDraft } from './useLegacyPackingDraft';

export function LegacyPackingDraftForm({
  document: doc,
  order,
  orders,
  documentKind: initialKind = 'PACKING',
  onSaved,
  onCancel,
}) {
  const {
    settings,
    featurePolicy,
    selectedOrders,
    formRef,
    documentKind,
    setDocumentKind,
    invoiceRequired,
    code,
    setCode,
    outlet,
    setOutlet,
    search,
    setSearch,
    outlets,
    setOutlets,
    searchingOutlets,
    items,
    setItems,
    invoices,
    setInvoices,
    cartons,
    setCartons,
    weight,
    setWeight,
    notes,
    setNotes,
    reason,
    setReason,
    error,
    busy,
    cancel,
    save,
    sourceOrderIds,
    sourceOrderId,
    totalCartonsNum,
    totalInvoiceCartons,
    isCartonBalanced,
    addItem,
    removeItem,
    addInvoice,
    removeInvoice,
  } = useLegacyPackingDraft({ doc, order, orders, initialKind, onSaved, onCancel });

  return (
    <form
      ref={formRef}
      onSubmit={save}
      className="rounded-2xl border border-primary/30 bg-surface p-5 md:p-6 space-y-6 shadow-md text-on-surface animate-fade-in"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-glass pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <LuPackage className="text-lg" />
            </span>
            <h2 className="text-lg font-black tracking-tight text-on-surface">
              {doc
                ? `Edit Dokumen: ${doc.code}`
                : documentKind === 'MANIFEST'
                  ? 'Buat manifest pengiriman'
                  : 'Siapkan dokumen muatan'}
            </h2>
          </div>
          <p className="text-xs text-on-surface-variant">
            {sourceOrderId
              ? `Terhubung dengan ${sourceOrderIds.length} order. Asal barang dan harga setiap order tetap dipertahankan.`
              : 'Penyusunan dokumen muatan manual tanpa keterikatan order sales.'}
          </p>
        </div>
        <button
          type="button"
          onClick={cancel}
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
        <details>
          <summary className="min-h-11 cursor-pointer">Jenis dokumen dan penomoran</summary>
          <label className="block text-sm">
            Jenis dokumen
            <select
              className="form-input block"
              disabled={!!doc}
              value={documentKind}
              onChange={(e) => {
                setDocumentKind(e.target.value);
                setCode('');
              }}
            >
              <option value="PACKING">Packing list</option>
              {(settings.PACKING_ALLOW_MANIFEST || documentKind === 'MANIFEST') && (
                <option value="MANIFEST">Manifest pengiriman tanpa dokumen packing</option>
              )}
            </select>
          </label>
          {documentKind === 'MANIFEST' && (
            <p className="text-sm">
              Manifest mencatat muatan dan tujuan langsung. Dokumen ini tidak menyatakan barang
              sudah dipacking atau diperiksa. Bukti persiapan dan pengiriman tetap mengikuti aturan
              trip.
            </p>
          )}
          <BusinessCodeInput
            entity={documentKind === 'MANIFEST' ? 'SHIPPING_MANIFEST' : 'PACKING_LIST'}
            value={code}
            onChange={setCode}
            existing={Boolean(doc)}
          />
        </details>
        <PackingOutletSection
          doc={doc}
          outlet={outlet}
          outlets={outlets}
          search={search}
          searchingOutlets={searchingOutlets}
          setOutlet={setOutlet}
          setOutlets={setOutlets}
          setSearch={setSearch}
          sourceOrderId={sourceOrderId}
        />
        <PackingItemsSection
          orderLinked={Boolean(sourceOrderId)}
          addItem={addItem}
          items={items}
          removeItem={removeItem}
          setItems={setItems}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container/40 border border-border-glass">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Total Fisik Karton / Kemasan Luar *
            </label>
            <input
              aria-label="Total karton fisik"
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
              aria-label="Estimasi berat total dalam kilogram"
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
        <PackingInvoicesSection
          invoiceRequired={invoiceRequired}
          items={items}
          orderLinked={!!sourceOrderId}
          addInvoice={addInvoice}
          doc={doc}
          invoices={invoices}
          isCartonBalanced={isCartonBalanced}
          removeInvoice={removeInvoice}
          setInvoices={setInvoices}
          totalCartonsNum={totalCartonsNum}
          totalInvoiceCartons={totalInvoiceCartons}
        />
        <div className="space-y-3">
          {selectedOrders.some((source) => source.status === 'PENDING_APPROVAL') && (
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Alasan pengecualian: order belum disetujui
              </label>
              <textarea
                aria-label="Alasan pengecualian Admin"
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
              aria-label="Instruksi pengiriman"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruksi tambahan untuk tim gudang atau supir (misal: titip faktur asli, simpan di tempat sejuk)..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs text-on-surface resize-none"
            />
          </div>
        </div>
        <div className="work-step-intro">
          <strong>Langkah berikutnya: kepala gudang</strong>Setelah diserahkan, dokumen masuk
          antrean muatan untuk diperiksa dan dijadwalkan. Menyimpan draft belum menyerahkan muatan.
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-glass">
          <button
            type="button"
            disabled={busy}
            onClick={cancel}
            className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            value="DRAFT"
            disabled={busy || !outlet || (!doc?.id && !featurePolicy.canStart)}
            title={!doc?.id ? featurePolicy.reason : undefined}
            className="px-6 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <LuRefreshCw className={`text-xs ${busy ? 'animate-spin' : ''}`} />
            <span>
              {busy
                ? 'Menyimpan Dokumen…'
                : doc
                  ? 'Simpan Perubahan'
                  : settings.PACKING_AUTO_RELEASE
                    ? 'Simpan dokumen'
                    : 'Simpan draft'}
            </span>
          </button>
          {!settings.PACKING_AUTO_RELEASE && (
            <button
              type="submit"
              value="RELEASE"
              className="admin-button primary"
              disabled={busy || !outlet || (!doc?.id && !featurePolicy.canStart)}
            >
              {busy ? 'Menyimpan…' : 'Serahkan ke gudang'}
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
