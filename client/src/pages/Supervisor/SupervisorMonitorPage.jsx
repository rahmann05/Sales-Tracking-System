import {OutletValidationAttendanceReport} from '../../shared/components/common/OutletValidationAttendanceReport';
import '../../styles/pages/OutletValidation.css';
import React from 'react';
import {LuRefreshCw,LuList,LuMap,LuClock,LuShieldCheck} from 'react-icons/lu';
import {useWorkspaceState} from '../../shared/hooks/useWorkspaceState';
import {useApp} from '../../context/AppContext';
import {TAB_IDS} from '../../constants/navigation';
import {useDailyCallMonitor} from '../DailyCallMonitor/hooks/useDailyCallMonitor';
import {SupervisorVisitList} from './components/SupervisorVisitList';
import {SalesmanDailyTimelineView} from '../DailyCallMonitor/components/SalesmanDailyTimelineView';
import {SuspiciousAttendanceTable} from '../DailyCallMonitor/components/SuspiciousAttendanceTable';
import {DailyCallDetailModal} from '../DailyCallMonitor/components/DailyCallDetailModal';
import {LiveSalesGpsTrackingTab} from '../TeamTracking/components/LiveSalesGpsTrackingTab';
import {ReportBasisNote} from '../Reports/components/ReportBasisNote';

export function SupervisorMonitorPage(){
  const {user,setActiveTab}=useApp();
  const [view,setView]=useWorkspaceState('spvView','visits');
  const canReport=user.permissions?.can_view_daily_call!==false;
  const report=useDailyCallMonitor({enabled:canReport});
  const isMap=view==='map';
  const canMap=user.permissions?.can_view_live_tracking!==false;
  const effectiveView=!canReport?'map':!canMap&&isMap?'visits':['visits','timeline','audit','map'].includes(view)?view:'visits';
  const tabs=[...(canReport?[['visits','Kunjungan',LuList],['timeline','Timeline sales',LuClock],['audit','Indikasi presensi',LuShieldCheck]]:[]),...(canMap?[['map','Posisi terkini',LuMap]]:[])];
  const summary=report.reportData?.summary;
  return <div className="workspace-page spv-workspace">
    <header className="spv-heading"><div><p className="admin-eyebrow">Pemantauan / Tim sales</p><h1>Pantau tim</h1><p>Pahami progres kunjungan dan periksa aktivitas yang membutuhkan perhatian.</p></div><button type="button" className="app-button" onClick={()=>setActiveTab(TAB_IDS.SPV_APPROVAL)}>Buka persetujuan</button></header>
    <nav className="spv-tabs" aria-label="Tampilan pemantauan">{tabs.map(([id,label,Icon])=><button type="button" key={id} aria-pressed={effectiveView===id} onClick={()=>setView(id)}><Icon aria-hidden="true"/>{label}</button>)}</nav>
    {effectiveView==='map'?<LiveSalesGpsTrackingTab/>:<>
      <div className="spv-toolbar"><label>Tanggal kunjungan (WIB)<input type="date" value={report.date} onChange={e=>e.target.value&&report.setDate(e.target.value)}/></label><label>Sales<select value={report.salesmanId} onChange={e=>report.setSalesmanId(e.target.value)}><option value="">Seluruh tim</option>{report.salesTeam.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="spv-search">Cari outlet<input type="search" placeholder="Nama atau kode outlet…" value={report.search} onChange={e=>report.setSearch(e.target.value,{replace:true})}/></label><button type="button" className="app-button" disabled={report.isLoading} onClick={report.refreshData}><LuRefreshCw/>{report.isLoading?'Memuat…':'Perbarui'}</button></div>
      {report.error&&<p className="app-error" role="alert">Data belum berhasil dimuat: {report.error}</p>}
      <div className="spv-metrics" aria-label="Ringkasan tanggal terpilih">{[['Kunjungan terencana','totalPlanCalls'],['Kunjungan aktual','totalActualCalls'],['Kunjungan efektif','totalEffectiveCalls'],['Indikasi perlu diperiksa','totalAnomalies']].map(([label,key])=><div key={key}><span>{label}</span><strong>{report.isLoading||report.error?'—':summary?.[key]??'—'}</strong></div>)}</div>
      <ReportBasisNote basis={report.reportData?.basis}/>
      {!report.error&&<section className="spv-panel spv-report-content">
        {effectiveView==='visits'&&<SupervisorVisitList rows={report.reportData?.rows||[]} loading={report.isLoading} onSelect={report.setSelectedRow}/>}
        {effectiveView==='timeline'&&<SalesmanDailyTimelineView salesmanSummaries={report.reportData?.salesmanSummaries||[]} isLoading={report.isLoading} onSelectStop={report.setSelectedRow}/>}
        {effectiveView==='audit'&&<><p className="spv-note">Indikasi membantu pemeriksaan bukti; bukan kesimpulan pelanggaran.</p><SuspiciousAttendanceTable rows={report.reportData?.rows||[]} isLoading={report.isLoading} onSelectRow={report.setSelectedRow}/></>}
      </section>}
      <OutletValidationAttendanceReport date={report.date} salesmanId={report.salesmanId} search={report.search} refreshKey={report.reportData}/>
      {report.selectedRow&&<DailyCallDetailModal row={report.selectedRow} onClose={()=>report.setSelectedRow(null)}/>}
    </>}
  </div>;
}
