import React from 'react';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';
import { LuPrinter, LuX, LuPackage, LuStore, LuFileText } from 'react-icons/lu';

export function PackingListPrintModal({ document: doc, onClose }) {
  if (!doc) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = doc.createdAt
    ? new Date(doc.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

  return (
    <NativeDialog
      open={Boolean(doc)}
      title={`Cetak Dokumen: ${doc.code}`}
      onClose={onClose}
    >
      <div className="space-y-6 text-on-surface p-1">
        {/* Print Action Bar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container/60 border border-border-glass no-print">
          <div className="text-xs text-on-surface-variant font-medium">
            Dokumen resmi siap cetak untuk operasional gudang dan pengiriman.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <LuPrinter className="text-sm" />
              <span>Cetak / Cetak PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-border-glass hover:bg-surface-container text-xs font-bold text-on-surface transition-all"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="printable-sheet bg-white text-slate-900 p-6 md:p-8 rounded-2xl border border-slate-300 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                PT. SINAR ANUGRAH
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Distribusi & Logistik Terpadu
              </p>
              <p className="text-xs text-slate-600">
                Surat Perintah Muat / Packing List Muatan
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-black text-slate-900 block">
                {doc.code}
              </span>
              <span className="text-xs text-slate-600 block">
                Tanggal: {formattedDate}
              </span>
              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 inline-block mt-1">
                Status: {doc.status === 'DRAFT' ? 'DRAFT ADMIN' : 'DIKIRIM KE GUDANG'} (Rev. {doc.revision || 1})
              </span>
            </div>
          </div>

          {/* Store & Delivery Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
            <div>
              <span className="text-slate-500 font-bold block uppercase text-[10px] tracking-wider">
                Tujuan Pengiriman (Outlet):
              </span>
              <strong className="text-sm text-slate-900 block mt-0.5">
                {doc.outlet?.name || 'Toko Belum Ditentukan'}
              </strong>
              <span className="text-slate-600 block mt-0.5">
                Kode Toko: {doc.outlet?.outletCode || '-'}
              </span>
              <p className="text-slate-700 mt-1 leading-snug">
                {doc.outlet?.address || '-'}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-bold block uppercase text-[10px] tracking-wider">
                Parameter Muatan:
              </span>
              <div className="mt-1 space-y-0.5">
                <p>
                  Total Kemasan: <strong className="text-slate-950">{doc.totalCartons || 0} Karton</strong>
                </p>
                <p>
                  Perkiraan Bobot: <strong className="text-slate-950">{doc.totalWeight ? `${doc.totalWeight} kg` : '-'}</strong>
                </p>
                <p>
                  Sumber Dokumen: <strong className="text-slate-950">{doc.source || 'MANUAL'}</strong>
                  {doc.sourceOrderId && ` (Ref Order: ${doc.sourceOrderId.slice(0, 8)})`}
                </p>
              </div>
            </div>
          </div>

          {/* Invoices List */}
          {doc.invoices && doc.invoices.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Faktur Penjualan Terlampir:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {doc.invoices.map((inv, idx) => (
                  <div
                    key={inv.id || idx}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-800"
                  >
                    Faktur: <strong>{inv.invoiceNumber}</strong> · {inv.totalCartons} Karton
                    {inv.totalAmount ? ` · Rp ${Number(inv.totalAmount).toLocaleString('id-ID')}` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Daftar Rincian Produk:
            </span>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <th className="p-2.5 w-10 text-center">No</th>
                    <th className="p-2.5 w-32 font-mono">SKU</th>
                    <th className="p-2.5">Nama Produk / Barang</th>
                    <th className="p-2.5 w-24 text-right">Jumlah</th>
                    <th className="p-2.5 w-20">Satuan</th>
                    <th className="p-2.5 w-24 text-center">Check Gudang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(doc.items || []).map((item, idx) => (
                    <tr key={item.lineId || idx} className="hover:bg-slate-50">
                      <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-semibold text-slate-700">
                        {item.sku || '-'}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="p-2.5 text-slate-600">{item.unit || 'unit'}</td>
                      <td className="p-2.5 text-center">
                        <div className="w-4 h-4 border border-slate-400 rounded mx-auto"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Override Reason */}
          {(doc.notes || doc.overrideReason) && (
            <div className="space-y-1 text-xs border-t border-slate-200 pt-3">
              {doc.notes && (
                <p className="text-slate-700">
                  <strong>Catatan Khusus:</strong> {doc.notes}
                </p>
              )}
              {doc.overrideReason && (
                <p className="text-amber-800">
                  <strong>Alasan Override Admin:</strong> {doc.overrideReason}
                </p>
              )}
            </div>
          )}

          {/* Signature Grid */}
          <div className="grid grid-cols-4 gap-4 pt-6 border-t border-slate-200 text-center text-xs">
            <div>
              <p className="text-slate-500 font-semibold mb-12">Dibuat Oleh (Admin)</p>
              <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              <p className="text-slate-700 font-bold mt-1">{doc.createdBy?.name || 'Admin Distribusi'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold mb-12">Disiapkan (Gudang)</p>
              <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              <p className="text-slate-700 font-bold mt-1">( Kepala Gudang )</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold mb-12">Diangkut (Supir)</p>
              <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              <p className="text-slate-700 font-bold mt-1">( Pengemudi )</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold mb-12">Diterima (Outlet)</p>
              <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              <p className="text-slate-700 font-bold mt-1">( Stempel & Ttd Toko )</p>
            </div>
          </div>
        </div>
      </div>
    </NativeDialog>
  );
}
