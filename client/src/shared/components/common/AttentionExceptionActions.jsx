import {request} from '../../../services/httpClient';
import React,{useState,useEffect} from 'react';
import {absensiApi,outletsApi,routeChangesApi} from '../../../services/api';
import {useApp} from '../../../context/AppContext';

const labels={SHIFT_TIME_RANGE:'Shift melewati batas waktu / tengah malam',OPEN_SPV_VISIT:'Kunjungan supervisi belum selesai',MISSING_OUT:'Absen keluar terlewat',UNCLOSED_SHIFT:'Shift belum ditutup',MANUAL_RESULT:'Persetujuan hasil kegiatan',OFF_PJP:'Validasi kunjungan luar PJP',MANUAL_PJP:'Persetujuan hasil manual PJP',MANUAL_OFF_PJP:'Persetujuan hasil manual luar PJP',UNLOCK:'Pengecualian absensi',ROUTE_CHANGE:'Keputusan toko tutup / reroute'};
export function AttentionExceptionActions({row,onChanged}){
  const {user}=useApp(),e=row.exception;
  const [decision,setDecision]=useState(''),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [replacement,setReplacement]=useState(''),[outletSearch,setOutletSearch]=useState(''),[options,setOptions]=useState([]),[loading,setLoading]=useState(false);
  useEffect(()=>{if(decision!=='REROUTE')return;let alive=true;setReplacement('');setLoading(true);outletsApi.directory({search:outletSearch,limit:25}).then(r=>{if(alive)setOptions(r.data);}).catch(err=>{if(alive)setError(err.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[decision,outletSearch]);
  const operational=['SHIFT_TIME_RANGE','MISSING_OUT','UNCLOSED_SHIFT','OPEN_SPV_VISIT','MANUAL_RESULT'].includes(e.kind);
  const decisions=operational?(e.kind==='MANUAL_RESULT'?['APPROVED','REJECTED']:['ACKNOWLEDGED','REQUIRES_CORRECTION']):e.kind==='ROUTE_CHANGE'?(e.pendingAdmin?['APPROVE','REJECT']:['SKIP','REROUTE','REJECT']):['APPROVE','REJECT'];
  const submit=async event=>{event.preventDefault();if(!decision)return;
    setBusy(true);setError('');try{
      if(operational)await request(`/attention/exceptions/${e.id}`,{method:'PATCH',body:JSON.stringify({decision,note:note.trim()})});
      else if(e.kind==='OFF_PJP')await absensiApi.validateOffPjp(e.id,decision==='APPROVE',note.trim());
      else if(e.kind.startsWith('MANUAL'))await absensiApi.reviewManualSales(e.kind==='MANUAL_PJP'?'PJP':'OFF_PJP',e.id,decision==='APPROVE'?'APPROVED':'REJECTED',note.trim());
      else if(e.kind==='UNLOCK')await outletsApi.handleUnlockRequest(e.id,decision==='APPROVE');
      else if(decision==='SKIP')await routeChangesApi.skip(e.id);
      else if(decision==='REROUTE')await routeChangesApi.reroute(e.id,replacement,note.trim());
      else if(decision==='APPROVE')await routeChangesApi.approveReroute(e.id);
      else await routeChangesApi.rejectReroute(e.id);
      window.dispatchEvent(new CustomEvent('operational-data-changed'));await onChanged();
    }catch(err){setError(err.message);}finally{setBusy(false);}
  };
  return <section className="space-y-3" aria-label={labels[e.kind]}>
    <strong>{labels[e.kind]}</strong><p>Pemohon: {e.applicantName||e.applicantId}</p>
    {e.decision?.note&&<p>Keputusan terakhir: {e.decision.value==='REQUIRES_CORRECTION'?'Perlu koreksi':e.decision.value} · {e.decision.note}</p>}
    {e.reason&&<p>Alasan / catatan pemohon: {e.reason}</p>}
    {e.kind==='SHIFT_TIME_RANGE'&&<p>{e.overnight?'Shift melewati tengah malam. ':''}Durasi saat ditandai: {e.elapsedMinutes} menit.{e.maxHours>0?` Batas pemeriksaan: ${e.maxHours} jam.`:''} Flag tidak menutup shift atau mengubah bukti presensi.</p>}
    {e.clarification&&<div className="app-notice"><strong>Penjelasan petugas</strong><p>{e.clarification.note}</p><small>{new Date(e.clarification.at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB · penjelasan tidak menggantikan bukti presensi.</small></div>}
    {e.orderAmount!==undefined&&<p>Hasil manual: Rp {Number(e.orderAmount||0).toLocaleString('id-ID')} · {e.skuSold||0} SKU. Ini bukan penerimaan pembayaran.</p>}
    {e.latitude!==undefined&&<p>Koordinat kunjungan: {e.latitude}, {e.longitude}</p>}
    {e.photoUrl&&/^(https?:\/\/|\/(?!\/))/.test(e.photoUrl)&&<a href={e.photoUrl} target="_blank" rel="noopener noreferrer" className="underline">Buka foto bukti kunjungan</a>}
    {e.replacementOutletName&&<p>Usulan toko pengganti: {e.replacementOutletName}</p>}
    {e.pendingAdmin&&user?.role!=='ADMIN'&&<p>Menunggu keputusan Admin; SPV tidak dapat menyetujui tahap ini.</p>}
    {e.kind==='ROUTE_CHANGE'&&!e.pendingAdmin&&<p>Menolak laporan mengembalikan toko asal ke status menunggu kunjungan. {e.decisionMode==='SEQUENTIAL'?'Skip maupun penggantian toko memerlukan persetujuan Admin setelah usulan Supervisor.':''}</p>}
    {e.proposedAction==='SKIP'&&<p>Usulan Supervisor: lewati toko tanpa pengganti.</p>}
    {!row.canDecide&&<p>Tindakan tidak tersedia bagi akun ini. Hubungi SPV / Admin yang berwenang.</p>}
    {row.canDecide&&<form className="space-y-3" onSubmit={submit}><fieldset disabled={busy} className="space-y-3">
      <label className="block">Keputusan<select required className="form-input block w-full" value={decision} onChange={event=>setDecision(event.target.value)}><option value="">Pilih keputusan</option>{decisions.map(value=><option key={value} value={value}>{value==='ACKNOWLEDGED'?'Akui pengecualian':value==='REQUIRES_CORRECTION'?'Tandai perlu koreksi':value==='APPROVED'?'Setujui hasil':value==='REJECTED'?'Tolak hasil':value==='SKIP'?'Akui laporan dan lewati toko':value==='REJECT'?'Tolak pengajuan':e.kind==='ROUTE_CHANGE'?'Setujui reroute':'Setujui pengajuan'}</option>)}</select></label>
      {decision==='REROUTE'&&<><label className="block">Cari toko pengganti<input className="form-input block w-full" value={outletSearch} onChange={event=>setOutletSearch(event.target.value)}/></label><label className="block">Toko pengganti (maksimal 25 hasil pencarian)<select required className="form-input block w-full" value={replacement} onChange={event=>setReplacement(event.target.value)}><option value="">{loading?'Memuat…':'Pilih outlet aktif dalam cakupan Anda'}</option>{options.map(o=><option key={o.id} value={o.id}>{o.name} · {o.address}</option>)}</select></label></>}
      {(operational||e.kind==='OFF_PJP'||e.kind.startsWith('MANUAL')||decision==='REROUTE')&&<label className="block">Catatan keputusan (wajib bila ditolak)<textarea className="form-input block w-full" required={operational||decision==='REJECT'||decision==='REROUTE'} maxLength={2000} value={note} onChange={event=>setNote(event.target.value)}/></label>}
      <button className="btn btn-secondary min-h-11" disabled={!decision}>{busy?'Menyimpan…':'Simpan keputusan'}</button>
    </fieldset></form>}
    {error&&<p role="alert" className="text-red-600">{error}</p>}
  </section>;
}
