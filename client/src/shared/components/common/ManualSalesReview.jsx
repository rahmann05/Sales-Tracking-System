import React, { useCallback, useEffect, useRef, useState } from 'react';
import { absensiApi } from '../../../services/api';
import { applyManualSalesDecision, REVIEW_PAGE_SIZE } from './manualSalesReviewState';
export function ManualSalesReview() {
  const [kind,setKind] = useState('PJP'); const [status,setStatus] = useState('PENDING'); const [page,setPage] = useState(1);
  const [result,setResult] = useState({data:[],total:0}); const [notes,setNotes] = useState({}); const [error,setError] = useState('');
  const [busyId,setBusyId] = useState(''); const [loading,setLoading] = useState(false); const [notice,setNotice] = useState(''); const revision=useRef(0);
  const load = useCallback(async () => {
    const current=++revision.current;setLoading(true);setError('');
    try { const response=await absensiApi.getManualSales({kind,status,page,limit:REVIEW_PAGE_SIZE}); if(current===revision.current)setResult(response.data); }
    catch(e) { if(current===revision.current)setError(e.message); }
    finally { if(current===revision.current)setLoading(false); }
  },[kind,status,page]);
  useEffect(() => { load(); return()=>{revision.current++;}; },[load]);
  const decide = async (id,decision) => {
    if(busyId)return;
    setBusyId(id);setError('');setNotice('');
    try {
      await absensiApi.reviewManualSales(kind,id,decision,notes[id] || '');
      setResult(previous=>applyManualSalesDecision(previous,id,decision,status));
      setNotes(previous=>{const next={...previous};delete next[id];return next;});
      setNotice(decision==='APPROVED'?'Hasil manual disetujui dan siap dihitung di laporan.':'Hasil manual ditolak.');
      window.dispatchEvent(new CustomEvent('operational-data-changed'));
      load();
    } catch(e) { setError(e.message); }
    finally { setBusyId(''); }
  };
  return <section className="bg-surface border border-border-glass rounded-2xl p-4 space-y-3">
    <h2 className="text-lg font-semibold">Persetujuan hasil manual absensi</h2>
    <p className="text-sm text-on-surface-variant">Hasil tanpa order terperinci hanya masuk laporan setelah disetujui. Kunjungan luar PJP perlu divalidasi terlebih dahulu. Data yang dicatat sebagai catatan saja tidak masuk antrean ini.</p>
    <div className="flex flex-wrap gap-3"><label>Jenis<select className="form-input block" value={kind} onChange={e=>{setKind(e.target.value);setPage(1);setNotice('');}}><option value="PJP">Absensi PJP</option><option value="OFF_PJP">Luar PJP</option></select></label><label>Status<select className="form-input block" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);setNotice('');}}><option value="PENDING">Menunggu</option><option value="APPROVED">Disetujui</option><option value="REJECTED">Ditolak</option></select></label><button type="button" className="self-end border rounded-lg px-3 py-2" onClick={load} disabled={loading}>Muat ulang</button></div>
    <p className="text-sm text-on-surface-variant"><strong>{result.total}</strong> pengajuan {status==='PENDING'?'menunggu keputusan':status==='APPROVED'?'sudah disetujui':'sudah ditolak'}.</p>
    {notice && <p role="status" aria-live="polite" className="text-emerald-700">{notice}</p>}{error && <p role="alert" className="text-red-700">{error}</p>}{loading && <p role="status">Memuat pengajuan...</p>}
    {result.data.map(r=><article key={r.id} className="border-t py-3 space-y-2"><p className="font-semibold">{r.user?.name} · {r.pjpStop?.outlet?.name || r.outletName}</p><p className="text-sm">{new Date(r.createdAt).toLocaleString('id-ID')} · Rp {Number(r.orderAmount || 0).toLocaleString('id-ID')} · {r.skuSold || 0} SKU</p><p className="text-sm">{(r.salesProducts || []).map(p=>p.name).join(', ')}</p>{status === 'PENDING' ? <><label className="block text-sm">Catatan keputusan (wajib jika ditolak)<input className="form-input w-full" maxLength={2000} value={notes[r.id] || ''} onChange={e=>setNotes({...notes,[r.id]:e.target.value})}/></label><div className="flex gap-3"><button type="button" disabled={Boolean(busyId)} className="bg-primary text-on-primary rounded-xl px-3 py-2" onClick={()=>decide(r.id,'APPROVED')}>{busyId===r.id?'Menyimpan…':'Setujui hasil'}</button><button type="button" disabled={Boolean(busyId)} className="border rounded-xl px-3 py-2" onClick={()=>decide(r.id,'REJECTED')}>Tolak</button></div></> : <p className="text-sm">Keputusan: {r.manualSalesStatus} · {r.manualSalesReviewNote || 'Tanpa catatan'} · {r.manualSalesReviewedAt && new Date(r.manualSalesReviewedAt).toLocaleString('id-ID')}</p>}</article>)}
    {!loading && !result.data.length && <p className="py-4">Tidak ada pengajuan pada filter ini.</p>}
    <div className="flex justify-end gap-4"><button type="button" disabled={page===1 || loading} onClick={()=>setPage(page-1)}>Sebelumnya</button><span>Halaman {page} · {result.total} pengajuan</span><button type="button" disabled={page*REVIEW_PAGE_SIZE >= result.total || loading} onClick={()=>setPage(page+1)}>Berikutnya</button></div>
  </section>;
}
