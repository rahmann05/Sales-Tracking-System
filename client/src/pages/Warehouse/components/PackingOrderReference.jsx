import { DataTable } from '../../../shared/components/common/DataTable';
import React, { useEffect, useState } from 'react';
import { ordersApi } from '../../../services/api';
import { LuBan, LuInfo } from 'react-icons/lu';
export function PackingOrderReference({ onSelect, allowPending }) {
  const [status, setStatus] = useState('APPROVED');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: {} });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    ordersApi.getAllOrders({ status, page, limit: 15 }).then(r => { if (active) setResult(r.data); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status, page]);
  const TAB_INFO = {
    APPROVED: { label: 'Disetujui supervisor', hint: null },
    PENDING_APPROVAL: { label: 'Menunggu persetujuan', hint: allowPending ? 'Order pending diizinkan masuk packing list. Wajib isi alasan override.' : 'Order pending hanya sebagai referensi. Aktifkan izin override di pengaturan admin untuk menggunakannya.' },
    REJECTED: { label: 'Ditolak', hint: 'Order yang ditolak supervisor tidak dapat dijadikan referensi packing list. Tampilkan sebagai informasi saja.' },
  };
  const currentTab = TAB_INFO[status];
  return <section className="rounded-2xl border border-border-glass bg-surface p-4 space-y-3">
    <h2 className="font-semibold text-lg">Referensi order sales</h2>
    <p className="text-sm text-on-surface-variant">Persetujuan order terpisah dari packing list. Pilih sebagai referensi atau buat dokumen manual tanpa order.</p>
    <div className="flex flex-wrap gap-2" aria-label="Status order">{[['APPROVED','Disetujui supervisor'],['PENDING_APPROVAL','Menunggu persetujuan'],['REJECTED','Ditolak']].map(([key,label]) => <button key={key} aria-pressed={status === key} className={`px-3 py-2 rounded-xl border ${status === key ? 'bg-primary text-on-primary' : 'border-border-glass'}`} onClick={() => { setStatus(key); setPage(1); }}>{label}</button>)}</div>
    {currentTab.hint && (
      <p className={`flex items-start gap-1.5 text-xs rounded-xl px-3 py-2 ${status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-surface-container text-on-surface-variant'}`}>
        {status === 'REJECTED' ? <LuBan className="shrink-0 mt-0.5" /> : <LuInfo className="shrink-0 mt-0.5" />}
        {currentTab.hint}
      </p>
    )}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {loading ? <p role="status">Memuat order...</p> : <div className="overflow-x-auto"><DataTable className="w-full text-sm text-left"><thead><tr className="border-b"><th className="">Tanggal / sales</th><th className="">Toko / barang</th><th className="">Nominal order</th><th className="">Aksi</th></tr></thead><tbody>{result.data?.map(o => <tr key={o.id} className="border-b border-border-glass align-top"><td className="">{new Date(o.createdAt).toLocaleDateString('id-ID')}<br/>{o.createdByUser?.name}</td><td className="">{o.pjpStop?.outlet?.name}<details><summary className="cursor-pointer py-2">{o.items.length} baris produk</summary>{o.items.map(i => <p key={i.id}>{i.product?.sku} · {i.product?.name}: {i.quantity} unit</p>)}</details></td><td className="">Rp {o.totalValue.toLocaleString('id-ID')}</td><td className="">{(status === 'APPROVED' || status === 'PENDING_APPROVAL' && allowPending) && <button className="border rounded-lg px-3 py-2" onClick={() => onSelect(o)}>Gunakan referensi</button>}{status === 'REJECTED' && <span className="inline-flex items-center gap-1 text-xs text-red-500 italic"><LuBan className="shrink-0" /> Tidak dapat digunakan</span>}</td></tr>)}</tbody></DataTable>{!result.data?.length && <p className="py-6 text-center">Tidak ada order pada status ini.</p>}</div>}
    <div className="flex items-center justify-end gap-3"><button disabled={page === 1 || loading} onClick={() => setPage(page - 1)}>Sebelumnya</button><span>Halaman {page}</span><button disabled={!result.pagination?.hasNextPage || loading} onClick={() => setPage(page + 1)}>Berikutnya</button></div>
  </section>;
}
