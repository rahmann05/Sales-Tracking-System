import {outletOperationalPoint} from './outlet-location.mjs';
import {addSlaHours} from './business-clock.mjs';
export const OUTLET_LOCATION_ALERT_LABELS={MISSING:'Titik operasional belum tersedia',EXPIRED:'Lokasi Google kedaluwarsa',CONFLICT:'Lokasi Google perlu diperiksa ulang',CHANGED:'Data acuan lokasi berubah',REFRESH_FAILED:'Pembaruan Google gagal'};
export function outletLocationAlert(outlet,now=Date.now()){
 const p=outletOperationalPoint(outlet,now),g=outlet.googleLocation;
 const code=p.latitude==null?(OUTLET_LOCATION_ALERT_LABELS[p.status]?p.status:'MISSING'):g?.status==='ACTIVE'&&g.lastError?'REFRESH_FAILED':null;
 if(!code)return null;
 const since=code==='EXPIRED'?g?.expiresAt:code==='MISSING'?outlet.createdAt:g?.problemSince||g?.lastCheckedAt||outlet.updatedAt;
 return {code,label:OUTLET_LOCATION_ALERT_LABELS[code],since:since||outlet.createdAt,usable:p.latitude!=null,expiresAt:g?.expiresAt||null,technical:code==='REFRESH_FAILED'};
}
export function fieldTaskTiming(task,now=Date.now()){
 const submitted=task.status==='SUBMITTED',hours=Number(task.policySnapshot?.values?.OUTLET_FIELD_REVIEW_SLA_HOURS??24);
 const submittedAt=submitted&&Number.isFinite(Date.parse(task.updatedAt))?task.updatedAt:null;
 const reviewDueAt=submittedAt&&hours>0?addSlaHours(submittedAt,hours,task.policySnapshot?.values||{}).toISOString():null;
 const deadline=submitted?reviewDueAt:task.status==='OPEN'?task.dueAt:null;
 return {submittedAt,reviewDueAt,waitingHours:submittedAt?Math.max(0,Math.floor((now-+new Date(submittedAt))/3600000)):null,overdue:!!deadline&&+new Date(deadline)<now};
}
