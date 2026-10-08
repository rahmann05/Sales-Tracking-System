import React from 'react';
import {useApp} from '../../context/AppContext';
import {useWorkspaceState} from '../../shared/hooks/useWorkspaceState';
import {useSelectedDetail} from '../../shared/hooks/useSelectedDetail';
import {wibDateKey} from '../../../../shared/visit-metrics.mjs';
import {SalesShiftHeader} from './components/SalesShiftHeader';
import {SalesDailyPerformanceTracker} from './components/SalesDailyPerformanceTracker';
import {SalesVisitList} from './components/SalesVisitList';
import {SalesStopCard} from './components/SalesStopCard';
import {SalesOffPjpSection} from './components/SalesOffPjpSection';
import {SalesModals} from './components/SalesModals';
import {useSalesVisitModals} from './hooks/useSalesVisitModals';
import {activeVisitStatuses,completedVisitStatuses,stampWib} from './salesPresentation';
export function SalesFieldView(){
  const {settings,salesStops,offPjpAttendances,syncStatus}=useApp();
  const [view,setView]=useWorkspaceState('salesVisitView','pjp'),[query,setQuery]=useWorkspaceState('salesVisitSearch',''),[filter,setFilter]=useWorkspaceState('salesVisitStatus','ALL'),[selectedId,setSelectedId]=useWorkspaceState('salesStop','');
  const modal=useSalesVisitModals();
  const todayLabel=new Date(`${wibDateKey()}T12:00:00+07:00`).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'});
  const ready=Boolean(syncStatus?.lastSuccessAt),error=syncStatus?.error;
  const stops=[...salesStops].sort((a,b)=>a.sequence-b.sequence);
  const active=stops.find(stop=>activeVisitStatuses.includes(stop.status));
  const selected=stops.find(stop=>stop.id===selectedId);
  const detailRef=useSelectedDetail(view==='offpjp'?null:selected?.id,true);
  const filtered=stops.filter(stop=>`${stop.outletName} ${stop.outletCode} ${stop.address}`.toLocaleLowerCase('id-ID').includes(query.trim().toLocaleLowerCase('id-ID'))&&(filter==='ALL'||filter==='ACTIVE'&&activeVisitStatuses.includes(stop.status)||filter==='DONE'&&completedVisitStatuses.includes(stop.status)||filter==='PENDING'&&stop.status==='PENDING'||filter==='EXCEPTION'&&['CLOSED','CLOSED_REPORTED','SKIPPED'].includes(stop.status)));
  const open=(type,stop)=>modal.openModal(type,stop);
  const selectStop=id=>{setSelectedId(id);if(id===selectedId&&detailRef.current){detailRef.current.focus({preventScroll:true});detailRef.current.scrollIntoView({block:'start'});}};
  return <div className="workspace-page sales-workspace">
    <header className="sales-heading"><div><p className="admin-eyebrow">Sales / Aktivitas lapangan</p><h1>Kunjungan hari ini</h1><p>PJP dan presensi Anda pada {todayLabel} (WIB). Pilih outlet untuk melanjutkan pekerjaan.</p></div><button type="button" className="app-button" onClick={()=>window.dispatchEvent(new CustomEvent('operational-data-changed'))}>Perbarui data</button></header>
    <SalesShiftHeader/>
    {error&&<div role="alert" className="app-error"><p>{error}</p><p>Perbarui data sebelum mencatat aktivitas. Sinkronisasi lengkap terakhir: {stampWib(syncStatus.lastSuccessAt)}.</p></div>}
    {!ready&&!error&&<p role="status">Memuat agenda dan presensi Anda…</p>}
    {ready&&!error&&<SalesDailyPerformanceTracker salesStops={stops} offPjpAttendances={offPjpAttendances} targetDailyVisits={settings.DAILY_CALL_TARGET_CALLS}/>}
    {ready&&active&&<section className="sales-active-visit" aria-label="Kunjungan sedang berlangsung"><div><span className="admin-eyebrow">Lanjutkan pekerjaan</span><h2>{active.outletName}</h2><p>Masuk {active.checkInTime||'sudah tercatat'}. Lengkapi order atau hasil kunjungan, lalu absen keluar.</p></div><button type="button" className="app-button app-button-primary" onClick={()=>{setView('pjp');selectStop(active.id);}}>Lanjutkan kunjungan</button></section>}
    <div className="sales-section-toolbar"><nav className="sales-tabs" aria-label="Jenis kunjungan"><button type="button" aria-pressed={view!=='offpjp'} onClick={()=>setView('pjp')}>PJP hari ini</button><button type="button" aria-pressed={view==='offpjp'} onClick={()=>setView('offpjp')}>Kunjungan luar PJP</button></nav><button type="button" className="app-button" disabled={!ready||Boolean(error)} onClick={()=>open('OFFPJP_ABSEN')}>Catat kunjungan luar PJP</button></div>
    {ready&&view!=='offpjp'&&<>
      <div className="sales-toolbar"><label className="sales-search">Cari outlet<input type="search" value={query} placeholder="Nama, kode, atau alamat…" onChange={e=>setQuery(e.target.value,{replace:true})}/></label><label>Status kunjungan<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="ALL">Semua status</option><option value="PENDING">Belum dikunjungi</option><option value="ACTIVE">Sedang berlangsung</option><option value="DONE">Selesai</option><option value="EXCEPTION">Tutup / dilewati</option></select></label><span className="sales-note">{filtered.length} dari {stops.length} outlet terjadwal</span></div>
      {!stops.length?<div className="sales-panel sales-empty"><h2>Belum ada PJP hari ini</h2><p>Hubungi Supervisor untuk memeriksa penugasan. Kunjungan tambahan dapat diajukan melalui Kunjungan luar PJP.</p></div>:<div className={`sales-split ${selected?'has-selection':''}`}>
        <SalesVisitList stops={filtered} selectedId={selectedId} onSelect={selectStop}/>
        {selected&&<aside className="sales-panel sales-detail" aria-label="Detail kunjungan"><div className="sales-detail-heading"><h2 ref={detailRef} tabIndex={-1}>Detail kunjungan</h2><button type="button" className="app-button" onClick={()=>setSelectedId('')}>Kembali ke daftar</button></div><fieldset disabled={Boolean(error)}><SalesStopCard stop={selected} allStops={stops} onAbsenIn={stop=>open('ABSEN_IN',stop)} onAbsenOut={stop=>open('ABSEN_OUT',stop)} onRequestUnlock={stop=>open('UNLOCK_REQUEST',stop)} onInputOrder={stop=>open('ORDER',stop)} onClosedReport={stop=>open('CLOSED_REPORT',stop)}/></fieldset></aside>}
      </div>}
    </>}
    {ready&&view==='offpjp'&&<SalesOffPjpSection offPjpAttendances={offPjpAttendances}/>}
    <SalesModals modalType={modal.modalType} selectedStop={modal.payload} activeVisitingStop={active} isOpen={modal.isOpen} onClose={modal.closeModal} handlers={modal.handlers}/>
  </div>;
}
