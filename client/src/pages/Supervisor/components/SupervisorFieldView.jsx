import {useSelectedDetail} from '../../../shared/hooks/useSelectedDetail';
import React,{useState,useEffect,useMemo} from 'react';
import {LuPlus,LuRefreshCw} from 'react-icons/lu';
import {useApp} from '../../../context/AppContext';
import {pjpApi,collectPages} from '../../../services/api';
import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
import {useWorkspaceState} from '../../../shared/hooks/useWorkspaceState';
import {useSupervisorFieldVisits} from '../hooks/useSupervisorFieldVisits';
import {SupervisorShiftHeader} from './SupervisorShiftHeader';
import {SpvStopCard} from './SpvStopCard';
import {SpvFieldModals} from './SpvFieldModals';
export function SupervisorFieldView({selectedDate}){
  const {user}=useApp();
  const [pjps,setPjps]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[refresh,setRefresh]=useState(0);
  const [filter,setFilter]=useWorkspaceState('spvFieldStatus','all'),[detailId,setDetailId]=useWorkspaceState('spvFieldStop','');
  useEffect(()=>{let live=true;setLoading(true);setError('');collectPages(pjpApi.getAllPjps,{date:selectedDate||wibDateKey()}).then(res=>{if(live)setPjps((Array.isArray(res.data)?res.data:res.data?.data||[]).filter(p=>wibDateKey(p.date)===(selectedDate||wibDateKey())));}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[selectedDate,user?.id,refresh]);
  const salesOptions=useMemo(()=>Array.from(new Map(pjps.filter(p=>p.user).map(p=>[p.user.id,{value:p.user.id,label:p.user.name}])).values()),[pjps]);
  const field=useSupervisorFieldVisits(pjps,salesOptions,refresh);
  const records=Object.values(field.spvVisitRecords);
  const active=records.find(record=>record.kind==='VISIT'&&record.status==='IN_VISIT');
  const activeStop=pjps.flatMap(p=>(p.stops||[]).map(stop=>({...stop,salesId:p.user?.id}))).find(stop=>stop.id===active?.activityKey);
  const selected=!field.recordsLoading&&!field.recordsError?field.spvStops.find(stop=>stop.id===detailId):null;
  const detailRef=useSelectedDetail(selected?.id);
  const rows=field.spvStops.filter(stop=>filter==='all'||(field.spvVisitRecords[stop.id]?.status||'PENDING')===filter);
  return <div className="spv-field-workspace">
    <SupervisorShiftHeader/>
    {active&&<div className="spv-active-visit" role="status"><div><strong>Kunjungan Anda sedang berlangsung: {active.outletName}</strong><p>Masuk {active.checkInTime}. Lengkapi audit dan absen keluar untuk menyelesaikan.</p></div>{activeStop&&<button type="button" className="app-button app-button-primary" onClick={()=>{field.setSelectedSales(activeStop.salesId);setDetailId(activeStop.id);}}>Lanjutkan kunjungan</button>}</div>}
    <div className="spv-toolbar"><label>Sales yang didampingi<select value={field.selectedSales} onChange={e=>{field.setSelectedSales(e.target.value);setDetailId('');}}><option value="">Pilih sales</option>{salesOptions.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></label><label>Kunjungan Anda<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Seluruh target PJP</option><option value="PENDING">Belum dikunjungi</option><option value="IN_VISIT">Sedang berlangsung</option><option value="COMPLETED">Selesai</option></select></label><button type="button" className="app-button" disabled={loading} onClick={()=>setRefresh(value=>value+1)}><LuRefreshCw/>Perbarui</button><button type="button" className="app-button app-button-primary" disabled={field.saving} onClick={field.openOffPjp}><LuPlus/>Kunjungan mandiri</button></div>
    {(error||field.recordsError||field.error)&&<p role="alert" className="app-error">{error||field.recordsError||field.error}</p>}
    <p className="spv-note">Daftar ini menunjukkan target supervisi dari PJP sales. Status dan presensi berikut adalah milik Anda sebagai Supervisor.</p>
    <div className={`spv-queue-layout ${selected?'has-selection':''}`}><section className="spv-panel spv-table-wrap"><table className="spv-table spv-mobile-cards"><thead><tr><th>Outlet</th><th>Alamat</th><th>Supervisi Anda</th><th>Aksi</th></tr></thead><tbody>{!loading&&!error&&!field.recordsLoading&&!field.recordsError&&rows.map(stop=>{const status=field.spvVisitRecords[stop.id]?.status||'PENDING';return <tr key={stop.id} aria-selected={detailId===stop.id}><td data-label="Outlet"><strong>{stop.outletName}</strong><small>{stop.assignedSales}</small></td><td data-label="Alamat">{stop.address}</td><td data-label="Supervisi Anda"><span className="app-status">{{PENDING:'Belum dikunjungi',IN_VISIT:'Berlangsung',COMPLETED:'Selesai'}[status]}</span></td><td data-label="Aksi"><button type="button" className="app-button" onClick={()=>setDetailId(stop.id)}>Buka kunjungan</button></td></tr>;})}{(loading||error||field.recordsLoading||field.recordsError||!rows.length)&&<tr><td colSpan="4">{loading||field.recordsLoading?'Memuat target dan presensi supervisi…':error||field.recordsError?'Target belum dapat ditampilkan. Coba perbarui.':'Tidak ada target PJP sesuai pilihan. Kunjungan mandiri tetap tersedia.'}</td></tr>}</tbody></table></section>
    {selected&&<aside className="spv-panel spv-queue-detail"><div className="spv-detail-heading"><h2 ref={detailRef} tabIndex={-1}>Detail supervisi</h2><button type="button" className="app-button" onClick={()=>setDetailId('')}>Tutup</button></div><SpvStopCard stop={selected} record={field.spvVisitRecords[selected.id]||{status:'PENDING'}} onAbsenIn={()=>field.openAbsenIn(selected)} onOpenAudit={()=>field.openAudit(selected)} onAbsenOut={()=>field.openAbsenOut(selected)}/></aside>}</div>
    {records.some(record=>record.kind==='OFF_PJP')&&<section className="spv-panel"><div className="spv-detail-heading"><h2>Kunjungan mandiri hari ini</h2></div><div className="spv-independent-list">{records.filter(record=>record.kind==='OFF_PJP').map(record=><article key={record.id}><strong>{record.outletName}</strong><p>{record.notes}</p><small>Tercatat {record.checkInTime||record.checkOutTime||'—'}</small></article>)}</div></section>}
    <SpvFieldModals error={field.error} saving={field.saving} activeModal={field.activeModal} spvMode={field.spvMode} setSpvMode={field.setSpvMode} selectedStop={field.selectedStop} inputNotes={field.inputNotes} onChangeNotes={field.setInputNotes} checklist={field.checklist} onChangeChecklist={field.setChecklist} followUp={field.followUp} onChangeFollowUp={field.setFollowUp} salesOptions={salesOptions} offPjpForm={field.offPjpForm} onChangeOffPjpForm={field.setOffPjpForm} onClose={field.closeModal} onConfirmAbsenIn={field.confirmAbsenIn} onSaveAudit={field.saveAudit} onConfirmAbsenOut={field.confirmAbsenOut} onConfirmOffPjp={field.confirmOffPjp}/>
  </div>;
}
