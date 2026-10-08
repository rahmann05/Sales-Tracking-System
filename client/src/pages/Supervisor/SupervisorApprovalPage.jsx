import {useSelectedDetail} from '../../shared/hooks/useSelectedDetail';

import {useSupervisorQueue} from './hooks/useSupervisorQueue';

import React,{useState} from 'react';

import {useApp} from '../../context/AppContext';

import {useWorkspaceState} from '../../shared/hooks/useWorkspaceState';

import {AdminApprovalPage} from '../Admin/AdminApprovalPage';

import {ManualSalesReview} from '../../shared/components/common/ManualSalesReview';

import {UnlockRequestCard} from '../Admin/components/UnlockRequestCard';

import {OffPjpAttendanceCard} from './components/OffPjpAttendanceCard';

import {IncidentCard} from './components/IncidentCard';

import {IncidentHandleModal} from './components/IncidentHandleModal';

const isPending=row=>['PENDING','PENDING_SPV','WAITING_SPV'].includes(row.status)||!row.status&&row.validationStatus==='MENUNGGU';

export function SupervisorApprovalPage(){

  const {user,handleSupervisorValidateOffPJP,handleSupervisorSkipOutlet,handleSupervisorDirectReroute,handleApproveUnlockRequest,handleRejectUnlockRequest}=useApp();

  const [section,setSection]=useWorkspaceState('spvApproval','orders');

  const [status,setStatus]=useWorkspaceState('spvQueue','pending');

  const [selectedId,setSelectedId]=useWorkspaceState('spvRequest','');

  const [search,setSearch]=useWorkspaceState('spvQueueSearch','');

  const [incident,setIncident]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');

  const canOrder=user.permissions?.can_approve_order!==false;

  const canUnlock=user.permissions?.can_unlock_absensi!==false;

  const tabs=[...(canOrder?[['orders','Order']]:[]),['manual','Hasil manual'],...(canUnlock?[['unlock','Izin presensi']]:[]),['closed','Toko tutup'],['offpjp','Luar PJP']];

  const active=tabs.some(([id])=>id===section)?section:tabs[0][0];

  const queue=useSupervisorQueue(active);

  const rows=(queue.data||[]).filter(row=>(status==='pending'?isPending(row):!isPending(row))&&`${row.outletName||''} ${row.salesName||row.userName||''} ${row.reason||''}`.toLocaleLowerCase('id-ID').includes(search.trim().toLocaleLowerCase('id-ID')));

  const selected=rows.find(row=>`${row.queueKind||row.type}:${row.id}`===selectedId);

  const detailRef=useSelectedDetail(selected?.id);

  const run=async(action)=>{if(busy)return false;setBusy(true);setError('');try{const result=await action();if(result===false){setError('Keputusan belum tersimpan. Periksa informasi terbaru lalu coba lagi.');return false;}window.dispatchEvent(new CustomEvent('operational-data-changed'));setSelectedId('');return true;}catch(e){setError(e.message);return false;}finally{setBusy(false);}};

  return <div className="workspace-page spv-workspace">

    <header className="spv-heading"><div><p className="admin-eyebrow">Pemeriksaan / Keputusan Supervisor</p><h1>Order & pengecualian</h1><p>Antrean terbuka lintas tanggal. Periksa setiap permintaan dan bukti sebelum memutuskan.</p></div></header>

    <nav className="spv-tabs" aria-label="Jenis persetujuan">{tabs.map(([id,label])=><button key={id} type="button" aria-pressed={active===id} onClick={()=>{setSection(id);setSelectedId('');}}>{label}</button>)}</nav>

    {active==='orders'&&<AdminApprovalPage ordersOnly hideHeading/>}

    {active==='manual'&&<div className="spv-panel"><ManualSalesReview/></div>}

    {!['orders','manual'].includes(active)&&<>

      <div className="spv-toolbar"><label className="spv-search">Cari permintaan<input type="search" placeholder="Outlet, sales, atau alasan…" value={search} onChange={e=>setSearch(e.target.value,{replace:true})}/></label><label>Status<select value={status} onChange={e=>{setStatus(e.target.value);setSelectedId('');}}><option value="pending">Menunggu keputusan</option><option value="history">Riwayat / tahap berikutnya</option></select></label><button type="button" className="app-button" disabled={queue.loading||busy} onClick={queue.reload}>Perbarui antrean</button><span className="spv-note">{queue.loading?'Memuat…':queue.error?'Data belum tersedia':`${rows.length} permintaan`}</span></div>

      {queue.error&&<p role="alert" className="app-error">Antrean gagal dimuat: {queue.error}</p>}

      {error&&<p role="alert" className="app-error">{error}</p>}

      <div className={`spv-queue-layout ${selected?'has-selection':''}`}><section className="spv-panel spv-table-wrap" aria-label="Daftar permintaan"><table className="spv-table spv-mobile-cards"><thead><tr><th>Outlet / pemohon</th><th>Alasan</th><th>Status</th><th>Pemeriksaan</th></tr></thead><tbody>{rows.map(row=>{const key=`${row.queueKind||row.type}:${row.id}`;return <tr key={key} aria-selected={selectedId===key}><td data-label="Outlet / pemohon"><strong>{row.outletName||'Outlet belum tersedia'}</strong><small>{row.salesName||row.userName||'Pemohon belum tersedia'}</small></td><td data-label="Alasan">{row.reason||'Lihat bukti permintaan'}</td><td data-label="Status"><span className="app-status">{isPending(row)?'Menunggu':row.status||row.validationStatus}</span></td><td data-label="Pemeriksaan"><button type="button" className="app-button" disabled={busy} onClick={()=>setSelectedId(key)}>Periksa</button></td></tr>;})}{!rows.length&&<tr><td colSpan="4">{queue.loading?'Memuat antrean…':queue.error?'Perbarui antrean untuk mencoba kembali.':'Tidak ada permintaan sesuai filter.'}</td></tr>}</tbody></table></section>

      {selected&&<aside className="spv-panel spv-queue-detail" aria-label="Bukti permintaan"><div className="spv-detail-heading"><h2 ref={detailRef} tabIndex={-1}>Detail permintaan</h2><button type="button" className="app-button" disabled={busy} onClick={()=>setSelectedId('')}>Tutup</button></div><fieldset disabled={busy}>

        {active==='unlock'?<UnlockRequestCard request={selected} onApprove={(id,stop,role)=>run(()=>handleApproveUnlockRequest(id,stop,role))} onReject={id=>run(()=>handleRejectUnlockRequest(id))}/>:selected.queueKind==='attendance'?<OffPjpAttendanceCard attendance={selected} onValidate={payload=>run(()=>handleSupervisorValidateOffPJP(payload))}/>:<IncidentCard incident={selected} onHandleIncident={setIncident}/>}

      </fieldset>{busy&&<p role="status">Menyimpan keputusan…</p>}</aside>}</div>

    </>}

    {incident&&<IncidentHandleModal isOpen incident={incident} onClose={()=>setIncident(null)} onSkip={async id=>{const ok=await run(()=>handleSupervisorSkipOutlet(id));if(ok)setIncident(null);return ok;}} onDirectReroute={async payload=>{const ok=await run(()=>handleSupervisorDirectReroute(payload));if(ok)setIncident(null);return ok;}}/>}

  </div>;

}

