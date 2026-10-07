import React, { useState, useEffect, useCallback } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { deliveryApi } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { PackingOrderReference } from './PackingOrderReference';
import { PackingDraftForm } from './PackingDraftForm';
export const PackingListManager = () => {
  const { user, settings } = useApp(); const admin = user?.role === 'ADMIN';
  const [result, setResult] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(1); const [status, setStatus] = useState(''); const [search, setSearch] = useState('');
  const [form, setForm] = useState(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => { setLoading(true); try { const r = await deliveryApi.getPackingLists({ page, limit: 20, search, status }); setResult(r.data); } catch(e) { setError(e.message); } finally { setLoading(false); } }, [page, search, status]);
  useEffect(() => { const timer = setTimeout(refresh, 250); return () => clearTimeout(timer); }, [refresh]);
  const action = async (id, name) => { if (busy) return; setBusy(true); setError(''); try { await deliveryApi.changePackingStatus(id, name); await refresh(); } catch(e) { setError(e.message); } finally { setBusy(false); } };
  return <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5 pb-20 text-on-surface">
    <header className="flex flex-wrap justify-between gap-3"><div><h1 className="text-xl font-bold">{admin ? 'Order & Packing List Admin' : 'Antrean Packing List Gudang'}</h1><p className="text-sm text-on-surface-variant">{admin ? 'Susun draft, periksa rincian, lalu kirim ke kepala gudang.' : 'Dokumen yang dilepas admin. Bagi muatan melalui menu Kelola Rute Pengiriman.'}</p></div>{admin && settings.PACKING_SOURCE_MODE !== 'ORDER' && <button className="bg-primary text-on-primary px-4 py-2 rounded-xl" onClick={() => setForm({})}>Buat manual</button>}</header>
    {admin && <p className="rounded-xl bg-surface-container p-3 text-sm">Mode sumber: {settings.PACKING_SOURCE_MODE}. {settings.PACKING_AUTO_RELEASE ? 'Dokumen lengkap otomatis dikirim ke gudang saat disimpan.' : 'Dokumen dikirim setelah admin memilih Kirim ke gudang.'}</p>}
    {admin && <PackingOrderReference allowPending={settings.PACKING_ALLOW_PENDING_ORDER} onSelect={order => setForm({ order })}/>}
    {form && admin && <PackingDraftForm key={form.document?.id || form.order?.id || 'manual'} {...form} onSaved={() => { setForm(null); refresh(); }} onCancel={() => setForm(null)}/>}
    <div className="flex flex-wrap gap-3"><label className="flex-1">Cari packing list<input className="form-input w-full" value={search} onChange={e => {setSearch(e.target.value);setPage(1);}} placeholder="Kode atau toko"/></label>{admin && <label>Status<select className="form-input block" value={status} onChange={e => {setStatus(e.target.value);setPage(1);}}><option value="">Semua</option><option value="DRAFT">Draft admin</option><option value="RELEASED">Dikirim ke gudang</option></select></label>}</div>
    {error && <p role="alert" className="text-red-700">{error}</p>}{loading && <p role="status">Memuat dokumen...</p>}
    <div className="space-y-3">{result.items.map(pl => {
      const needsCompletion = pl.status === 'DRAFT' && pl.totalCartons === 0;
      return <article key={pl.id} className={`bg-surface border rounded-2xl p-4 space-y-3 ${needsCompletion ? 'border-amber-300 bg-amber-50/40 dark:bg-amber-900/10' : 'border-border-glass'}`}>
      <div className="flex flex-wrap justify-between gap-3"><div className="space-y-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{pl.code} · {pl.outlet?.name}</h2>{needsCompletion && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 border border-amber-300"><FiAlertTriangle className="shrink-0" /> Perlu dilengkapi</span>}</div><p className="text-sm text-on-surface-variant">{pl.status === 'DRAFT' ? (needsCompletion ? 'Draft belum lengkap — isi karton & faktur sebelum dapat dikirim ke gudang' : 'Draft admin') : 'Dikirim ke gudang'} · {pl.source} · Revisi {pl.revision}</p></div><div className="text-sm text-right">{pl.totalCartons} karton · Dialokasikan {pl.allocatedCartons} · <strong>Sisa {pl.remainingCartons}</strong></div></div>
      <details><summary className="cursor-pointer py-2">Rincian barang, faktur, dan histori</summary><div className="space-y-2 text-sm">{pl.remainingItems.map(i => <p key={i.lineId}>{i.sku} · {i.name}: {i.quantity} {i.unit} · Sisa {i.remaining}</p>)}{pl.invoices.map(i => <p key={i.id}>Faktur {i.invoiceNumber}: {i.totalCartons} karton</p>)}{pl.notes && <p>Catatan: {pl.notes}</p>}{pl.overrideReason && <p>Override: {pl.overrideReason}</p>}{pl.history.map((h,i) => <p key={i}>{new Date(h.at).toLocaleString('id-ID')} · {h.action} · {h.userId}</p>)}</div></details>
      {admin && <div className="flex flex-wrap gap-2">{pl.status === 'DRAFT' ? <><button disabled={busy} className="border rounded-lg px-3 py-2" onClick={() => setForm({ document: pl })}>Edit draft</button><button disabled={busy} className="bg-primary text-on-primary rounded-lg px-3 py-2" onClick={() => action(pl.id,'RELEASE')}>Kirim ke gudang</button></> : !pl.deliveryStops.length && settings.PACKING_ALLOW_REVISION && <button disabled={busy} className="border rounded-lg px-3 py-2" onClick={() => action(pl.id,'RECALL')}>Tarik untuk revisi</button>}</div>}
    </article>;
    })}</div>
    {!loading && !result.items.length && <p className="text-center py-8">Tidak ada packing list pada filter ini.</p>}
    <div className="flex justify-end gap-4"><button disabled={page === 1 || loading} onClick={() => setPage(page-1)}>Sebelumnya</button><span>Halaman {page} · {result.total} dokumen</span><button disabled={page*20 >= result.total || loading} onClick={() => setPage(page+1)}>Berikutnya</button></div>
  </div>;
};
