import React from 'react';
import {useApp} from '../../../context/AppContext';
import {outletValidationApi} from '../../../services/api';
import {useFormDraft} from '../../../shared/hooks/useFormDraft';
import {OutletFieldEvidence} from './OutletFieldEvidence';
import {OutletFieldHistory} from './OutletFieldHistory';
import {stamp} from '../../OutletManagement/outletPresentation';
import {fieldTaskTiming} from '../../../../../shared/outlet-monitoring.mjs';
export function FieldTaskReview({task:t,actors,disabled,act,readOnly=false}){
 const {user}=useApp(),draft=useFormDraft(`outlet-field-review:${t.id}`,{reason:''});
 const action=action=>act(()=>outletValidationApi.fieldAction(t.id,{action,revision:t.revision,reason:draft.value.reason}));
 const timing=fieldTaskTiming(t);
 return <div className="ov-field-task">{t.review?.outlet?.name&&<h3>{t.review.outlet.name}</h3>}<strong>{{OPEN:'Menunggu Sales',SUBMITTED:'Bukti perlu diperiksa',DONE:'Bukti diterima',CANCELLED:'Dibatalkan'}[t.status]}</strong><p>{actors?.sales.find(p=>p.id===t.ownerId)?.name||'Sales pelaksana'} · pemeriksa {actors?.reviewers.find(p=>p.id===t.reviewerId)?.name||'Akun pemeriksa'} · {stamp(t.dueAt)}</p><p>{t.instructions}</p>{t.schedule?.assignedOn&&<p className="ov-muted">Agenda: {t.schedule.assignedOn} · {t.schedule.mode==='UNTIL_COMPLETE'?'tetap muncul sampai kasus selesai':'hanya hari ditugaskan'} · PJP {t.pjpStopId?'terhubung':'belum tersedia'}</p>}{t.status==='SUBMITTED'&&<p className="ov-muted">Bukti menunggu {timing.waitingHours??'—'} jam · tenggat pemeriksa {stamp(timing.reviewDueAt)}{timing.overdue?' · terlambat':''}</p>}<OutletFieldEvidence evidence={t.evidence}/><OutletFieldHistory task={t}/>
  {!readOnly&&['OPEN','SUBMITTED'].includes(t.status)&&<form className="app-form" onSubmit={event=>{event.preventDefault();action('ACCEPT');}}><label className="app-field">Alasan keputusan tugas<textarea minLength={10} maxLength={2000} value={draft.value.reason} disabled={disabled} onChange={event=>draft.field('reason')(event.target.value)} required/></label><div className="app-actions">{t.status==='SUBMITTED'&&user?.permissions?.can_review_outlet_field&&user.id!==t.ownerId&&(user.role==='ADMIN'||user.id===t.reviewerId)&&<><button className="app-button app-button-primary" disabled={disabled}>Terima bukti & siapkan usulan</button><button type="button" className="app-button" disabled={disabled||draft.value.reason.length<10} onClick={()=>action('RETURN')}>Minta kelengkapan</button></>}{user?.permissions?.can_assign_outlet_review&&<button type="button" className="app-button" disabled={disabled||draft.value.reason.length<10} onClick={()=>action('CANCEL')}>Batalkan tugas</button>}</div></form>}
 </div>;
}
