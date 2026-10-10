import {useWorkspaceState} from '../../hooks/useWorkspaceState';
import {SupervisorExceptionLink} from '../../../pages/Supervisor/components/SupervisorExceptionLink';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {request} from '../../../services/httpClient';
import {FollowUpActions} from './FollowUpActions';
import {AttentionExceptionActions} from './AttentionExceptionActions';
import {AttentionLocationActions} from './AttentionLocationActions';
import {AttentionEscalations} from './AttentionEscalations';
import {OrderReviewAssignmentEditor} from './OrderReviewAssignmentEditor';
import {useApp} from '../../../context/AppContext';
import {TAB_IDS,getNavigationTabs} from '../../../constants/navigation';
import {OperationalIssues} from '../../../pages/Warehouse/components/OperationalIssues';
const categories={ALL:'Semua modul',ORDER:'Order',PACKING:'Packing',TRIP:'Trip',PREPARATION:'Persiapan gudang',ISSUE:'Masalah pengiriman',VISIT:'Tindak lanjut kunjungan',EXCEPTION:'Pengecualian & validasi sales',OUTLET_REVIEW:'Pemeriksaan outlet',OUTLET_LOCATION:'Lokasi outlet',RETURN:'Pemeriksaan retur'};
const stamp=v=>v?new Date(v).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):'Belum ditetapkan';
export function AttentionPanel(){
 const {user,setActiveTab}=useApp();
 const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [pageValue,setPage]=useWorkspaceState('attentionPage','1'),[filter,setFilter]=useWorkspaceState('attentionFilter','ALL'),[category,setCategory]=useWorkspaceState('attentionCategory','ALL');
 const page=Math.max(1,Number(pageValue)||1);
 const [,setOrderDetail]=useWorkspaceState('orderDetail','');
 const [,setOutletReview]=useWorkspaceState('outletReview','');
 const openTarget=row=>{if(row.target==='OUTLET_REVIEW')setOutletReview(row.reference?.outletReviewId||'');if(row.target==='APPROVAL')setOrderDetail(row.reference?.orderId||'');setActiveTab(targets[row.target]);};
 const flight=useRef(0);
 const reload=useCallback(async()=>{const seq=++flight.current;setLoading(true);try{const result=await request(`/attention?page=${page}&filter=${filter}&category=${category}`);if(seq===flight.current){setData({...result.data,scope:`${page}:${filter}:${category}`});setError('');}}catch(e){if(seq===flight.current)setError(e.message);}finally{if(seq===flight.current)setLoading(false);}},[page,filter,category]);
 useEffect(()=>{reload();const timer=setInterval(reload,60000);window.addEventListener('focus',reload);window.addEventListener('operational-data-changed',reload);return()=>{flight.current++;clearInterval(timer);window.removeEventListener('focus',reload);window.removeEventListener('operational-data-changed',reload);};},[reload]);
 const targets={OUTLET_REVIEW:TAB_IDS.OUTLET_VALIDATION,APPROVAL:TAB_IDS.ADMIN_APPROVAL,PACKING:TAB_IDS.DELIVERY_PACKING_LIST,DELIVERY:TAB_IDS.DELIVERY_MONITOR};
 const currentView=data?.scope===`${page}:${filter}:${category}`;
 const allowedTabs=getNavigationTabs(user).map(tab=>tab.id);
 const canAssign=['ADMIN','KEPALA_GUDANG'].includes(user?.role);
 return <section className="border rounded-2xl p-4 space-y-4 bg-surface" aria-label="Pekerjaan lintas modul">
  <div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-lg font-bold">Pekerjaan yang perlu dituntaskan</h2><p className="text-sm">Antrean terbuka lintas tanggal. Satu dokumen dapat memiliki beberapa pekerjaan.</p></div><button className="btn btn-secondary min-h-11" disabled={loading} onClick={reload}>{loading?'Memperbarui…':'Perbarui'}</button></div>
  <p role="status" className="text-sm">{error?'Pembaruan gagal. Angka terakhir mungkin sudah lama.':data?'Diperbarui otomatis setiap menit.':'Memuat antrean…'} Terakhir berhasil: {stamp(data?.generatedAt)}</p>
  {error&&<p role="alert" className="text-red-600">{error}</p>}
  {data?.policyNote&&<p className="text-xs">{data.policyNote}</p>}
  <AttentionEscalations/>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[['Total pekerjaan','total'],['Lewat tenggat','overdue'],['Menunggu pemeriksaan','awaitingReview'],['Belum ada PIC','missingOwner'],['Belum ada tenggat','missingDeadline']].map(([label,key])=><div className="border rounded-xl p-3" key={key}><p className="text-sm">{label}</p><strong className="text-2xl">{currentView?(data?.summary[key]??'—'):'—'}</strong></div>)}</div>
  <div className="flex flex-wrap gap-3"><label>Kondisi<select className="form-input block" value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}><option value="ALL">Semua terbuka</option><option value="MINE">Tugas tahap saya</option><option value="REVIEW">Menunggu pemeriksaan</option><option value="OVERDUE">Lewat tenggat</option><option value="UNASSIGNED">Belum ada PIC</option><option value="UNSCHEDULED">Belum ada tenggat</option></select></label><label>Modul<select className="form-input block" value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}>{Object.entries(categories).filter(([id])=>user?.role!=='SUPERVISOR'||['ALL','ORDER','VISIT','EXCEPTION','OUTLET_REVIEW','OUTLET_LOCATION'].includes(id)).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label></div>
  {!loading&&!error&&data?.total===0&&<p>Tidak ada pekerjaan sesuai filter.</p>}
  {currentView&&!error&&data?.rows.map(row=><details key={row.key} className="border rounded-xl p-3"><summary className="cursor-pointer min-h-11"><strong>{row.title}</strong><span className="block text-sm">{categories[row.category]} · {row.overdue?'Lewat tenggat':row.missingDeadline?'Belum ada tenggat':'Dalam tenggat'}{row.needsReview?' · Menunggu keputusan / pemeriksaan':''} · PIC tahap: {row.ownerName||row.ownerId||'Belum ditugaskan'}</span></summary><div className="pt-3 space-y-3"><p>{row.nextAction}</p><p className="text-sm">Peran terkait: {row.responsibleRole}<br/>Menunggu sejak: {stamp(row.since)}<br/>Tenggat tahap: {row.status==='SUBMITTED'?stamp(row.reviewDueAt):row.dueDate?`${row.dueDate} (sampai akhir hari WIB)`:stamp(row.dueAt)}</p>
   {row.ownerSource==='TEAM_SUPERVISOR'&&<p className="text-xs">PIC tahap ini mengikuti SPV tim saat ini.</p>}
   {row.locationAlert&&<AttentionLocationActions row={row} onChanged={reload}/>}
   {row.stage==='ORDER_APPROVAL'&&<OrderReviewAssignmentEditor orderId={row.reference.orderId}/>}
   {row.approvalAssignment?.ownerValid===false&&<p role="alert" className="text-red-600">Pemeriksa yang ditetapkan sudah tidak memenuhi syarat. Admin perlu mengalihkan penugasan atau mengambil alih keputusan dengan alasan.</p>}
   {row.status==='SUBMITTED'&&<p className="text-sm">Tenggat pemeriksaan: {stamp(row.reviewDueAt)}. Tenggat pengerjaan PIC sebelumnya: {row.dueDate||(row.dueAt?stamp(row.dueAt):'Belum ditetapkan')}.</p>}
   {row.deadlineSource==='SLA_POLICY'&&<p className="text-xs">Tenggat tahap berasal dari SLA saat ini: {row.slaHours} jam sesuai kalender SLA sejak tahap dimulai.</p>}
   {row.target==='EXCEPTION'?(user?.role==='SUPERVISOR'&&!['SHIFT_TIME_RANGE','MISSING_OUT','UNCLOSED_SHIFT','OPEN_SPV_VISIT','MANUAL_RESULT'].includes(row.exception?.kind)?<SupervisorExceptionLink row={row}/>:<AttentionExceptionActions row={row} onChanged={reload}/>):row.target==='FOLLOW_UP'?<FollowUpActions policySnapshot={row.policySnapshot} id={row.activityId} followUp={row.followUp} onChanged={reload}/>:targets[row.target]&&allowedTabs.includes(targets[row.target])&&<button type="button" className="btn btn-secondary min-h-11" onClick={()=>openTarget(row)}>Buka modul {categories[row.category]}</button>}
   {canAssign&&!['OUTLET_REVIEW','OUTLET_LOCATION'].includes(row.target)&&(row.reference||row.issue)&&<OperationalIssues issues={row.issue?[row.issue]:[]} people={data.people} reference={row.reference} onChanged={reload}/>}
  </div></details>)}
  <nav aria-label="Halaman pekerjaan" className="flex gap-3 items-center"><button className="btn btn-secondary min-h-11" disabled={loading||page===1} onClick={()=>setPage(page-1)}>Sebelumnya</button><span>Halaman {page} · {data?.total??'—'} pekerjaan sesuai filter</span><button className="btn btn-secondary min-h-11" disabled={loading||!data||page*data.limit>=data.total} onClick={()=>setPage(page+1)}>Berikutnya</button></nav>
 </section>;
}
