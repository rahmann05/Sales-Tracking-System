import React,{useCallback,useEffect,useRef,useState} from 'react';
import {absensiApi} from '../../../services/api';
import {applyManualSalesDecision,REVIEW_PAGE_SIZE} from './manualSalesReviewState';
import {useWorkspaceState} from '../../hooks/useWorkspaceState';
import {useSelectedDetail} from '../../hooks/useSelectedDetail';
export function ManualSalesReview(){
  const [kind,setKind]=useWorkspaceState('manualKind','PJP'),[status,setStatus]=useWorkspaceState('manualStatus','PENDING'),[selectedId,setSelectedId]=useWorkspaceState('manualDetail','');
  const [page,setPage]=useState(1),[result,setResult]=useState(null),[note,setNote]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[notice,setNotice]=useState('');
  const revision=useRef(0);
  const load=useCallback(async()=>{
    const current=++revision.current;setLoading(true);setError('');setResult(null);
    try{const response=await absensiApi.getManualSales({kind,status,page,limit:REVIEW_PAGE_SIZE});if(!Array.isArray(response.data?.data))throw new Error('Respons antrean hasil manual belum dapat dibaca.');if(current===revision.current)setResult(response.data);}
    catch(e){if(current===revision.current)setError(e.message);}finally{if(current===revision.current)setLoading(false);}
  },[kind,status,page]);
  useEffect(()=>{load();return()=>{revision.current++;};},[load]);
  const selected=result?.data.find(row=>row.id===selectedId);
  const detailRef=useSelectedDetail(selected?.id);
  const decide=async decision=>{
    if(busy||!selected||decision==='REJECTED'&&!note.trim())return;
    setBusy(true);setError('');setNotice('');
    try{await absensiApi.reviewManualSales(kind,selected.id,decision,note);setResult(previous=>applyManualSalesDecision(previous,selected.id,decision,status));setSelectedId('');setNote('');setNotice(decision==='APPROVED'?'Hasil manual disetujui.':'Hasil manual ditolak.');window.dispatchEvent(new CustomEvent('operational-data-changed'));await load();}
    catch(e){setError(e.message);}finally{setBusy(false);}
  };
  return <section className="spv-manual-workspace">
    <div className="spv-detail-heading"><div><h2>Pemeriksaan hasil manual</h2><p className="spv-note">Hasil kunjungan tanpa order terperinci. Validasi kunjungan luar PJP dilakukan lebih dahulu.</p></div></div>
    <div className="spv-manual-body"><div className="spv-toolbar"><label>Jenis kunjungan<select disabled={busy} value={kind} onChange={e=>{setKind(e.target.value);setPage(1);setSelectedId('');}}><option value="PJP">Dalam PJP</option><option value="OFF_PJP">Luar PJP</option></select></label><label>Status hasil<select disabled={busy} value={status} onChange={e=>{setStatus(e.target.value);setPage(1);setSelectedId('');}}><option value="PENDING">Menunggu</option><option value="APPROVED">Disetujui</option><option value="REJECTED">Ditolak</option></select></label><button type="button" className="app-button" onClick={load} disabled={loading||busy}>Perbarui</button><span className="spv-note">{result?.total??'—'} pengajuan</span></div>
    {notice&&<p role="status">{notice}</p>}{error&&<p role="alert" className="app-error">{error}</p>}
    <div className={`spv-queue-layout ${selected?'has-selection':''}`}><div className="spv-panel spv-table-wrap"><table className="spv-table spv-mobile-cards"><thead><tr><th>Sales / outlet</th><th>Waktu pengajuan</th><th>Pemeriksaan</th></tr></thead><tbody>{result?.data.map(row=><tr key={row.id}><td data-label="Outlet / sales"><strong>{row.pjpStop?.outlet?.name||row.outletName}</strong><small>{row.user?.name}</small></td><td data-label="Waktu pengajuan">{new Date(row.createdAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB</td><td data-label="Pemeriksaan"><button type="button" className="app-button" disabled={busy} onClick={()=>{setSelectedId(row.id);setNote('');}}>Periksa</button></td></tr>)}{!result?.data.length&&<tr><td colSpan="3">{loading?'Memuat pengajuan…':error?'Data pengajuan belum tersedia.':'Tidak ada pengajuan sesuai filter.'}</td></tr>}</tbody></table></div>
    {selected&&<aside className="spv-panel spv-queue-detail"><div className="spv-detail-heading"><h2 ref={detailRef} tabIndex={-1}>Detail hasil manual</h2><button type="button" className="app-button" disabled={busy} onClick={()=>setSelectedId('')}>Tutup</button></div><div className="spv-visit-detail"><strong>{selected.pjpStop?.outlet?.name||selected.outletName}</strong><p>Sales: {selected.user?.name}</p><p>Nilai hasil yang dilaporkan: Rp {Number(selected.orderAmount||0).toLocaleString('id-ID')} · {selected.skuSold||0} SKU. Ini bukan penerimaan pembayaran.</p><p>{(selected.salesProducts||[]).map(product=>product.name).join(', ')||'Rincian produk belum tersedia'}</p>{selected.photoUrl&&<a href={selected.photoUrl} target="_blank" rel="noopener noreferrer">Buka foto bukti</a>}{status==='PENDING'?<><label className="app-field">Catatan keputusan (wajib jika ditolak)<textarea value={note} disabled={busy} maxLength={2000} onChange={e=>setNote(e.target.value)}/></label><div className="app-actions"><button type="button" className="app-button app-button-primary" disabled={busy} onClick={()=>decide('APPROVED')}>{busy?'Menyimpan…':'Setujui hasil'}</button><button type="button" className="app-button" disabled={busy||!note.trim()} onClick={()=>decide('REJECTED')}>Tolak hasil</button></div></>:<p>Keputusan: {selected.manualSalesStatus} · {selected.manualSalesReviewNote||'Tanpa catatan'}</p>}</div></aside>}</div>
    <footer className="admin-pagination"><span>Halaman {page}</span><div><button type="button" disabled={page===1||loading||busy} onClick={()=>setPage(page-1)}>Sebelumnya</button><button type="button" disabled={!result||page*REVIEW_PAGE_SIZE>=result.total||loading||busy} onClick={()=>setPage(page+1)}>Berikutnya</button></div></footer></div>
  </section>;
}
