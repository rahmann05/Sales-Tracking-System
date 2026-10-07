import React from 'react';
import { BusinessCodeInput } from '../../../shared/components/common/BusinessCodeInput';
import { LuPlus, LuTrash2, LuTriangleAlert, LuCircleCheck, LuFileText } from 'react-icons/lu';
export function PackingInvoicesSection({
  addInvoice,
  doc,
  invoices,
  isCartonBalanced,
  removeInvoice,
  setInvoices,
  totalCartonsNum,
  totalInvoiceCartons
}) {
  return <div className="space-y-3">
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

            <button type="button" onClick={addInvoice} className="px-3 py-1.5 rounded-xl border border-border-glass hover:bg-surface-container text-xs font-bold text-primary flex items-center gap-1.5 transition-all shadow-xs">
              <LuPlus className="text-sm" />
              <span>Tambah Faktur</span>
            </button>
          </div>

          {/* Validation Balance Indicator */}
          <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${isCartonBalanced ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'}`}>
            {isCartonBalanced ? <LuCircleCheck className="text-emerald-600 dark:text-emerald-400 text-sm shrink-0" /> : <LuTriangleAlert className="text-amber-600 dark:text-amber-400 text-sm shrink-0" />}
            <span className="font-semibold">
              {isCartonBalanced ? `Total karton faktur (${totalInvoiceCartons}) seimbang dengan total karton dokumen (${totalCartonsNum}). Dokumen siap dilepas ke gudang.` : `Total karton faktur (${totalInvoiceCartons}) belum sama dengan total karton dokumen (${totalCartonsNum}). Syarat rilis gudang memerlukan kesamaan karton.`}
            </span>
          </div>

          {invoices.length > 0 && <div className="space-y-2">
              {invoices.map((inv, index) => <div key={index} className="p-3 rounded-xl bg-surface-container/30 border border-border-glass grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                      Nomor Faktur *
                    </label>
                    <BusinessCodeInput entity="INVOICE" value={inv.invoiceNumber} onChange={invoiceNumber => setInvoices(invoices.map((v, i) => i === index ? {
            ...v,
            invoiceNumber
          } : v))} existing={Boolean(doc?.invoices?.some(i => i.invoiceNumber === inv.invoiceNumber))} />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                      Karton Faktur *
                    </label>
                    <input type="number" required min="1" step="1" value={inv.totalCartons} onChange={e => setInvoices(invoices.map((v, i) => i === index ? {
            ...v,
            totalCartons: Number(e.target.value)
          } : v))} className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border-glass text-xs font-bold text-on-surface text-right" />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                      Nominal Rp (Opsional)
                    </label>
                    <input type="number" min="0" value={inv.totalAmount ?? ''} onChange={e => setInvoices(invoices.map((v, i) => i === index ? {
            ...v,
            totalAmount: e.target.value
          } : v))} placeholder="Nominal rupiah" className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border-glass text-xs font-mono text-on-surface text-right" />
                  </div>

                  <div className="sm:col-span-1 flex justify-center pb-0.5">
                    <button type="button" onClick={() => removeInvoice(index)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-all cursor-pointer" title="Hapus faktur ini">
                      <LuTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>)}
            </div>}
        </div>;
}
