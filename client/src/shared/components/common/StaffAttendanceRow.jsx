import React from 'react';
import {shiftTimeView} from '../../../../../shared/shift-policy.mjs';
import {attendanceKind,attendanceStatus} from '../../../../../shared/staff-attendance-report.mjs';

export function StaffAttendanceRow({row:r,pendingOnly,onDetails}){
 const t=shiftTimeView(r);
 const time=value=>value?new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
 const [status,...notes]=attendanceStatus(r).split(' · ');
 return <tr>
  <th scope="row"><span className="staff-attendance-name">{r.user?.name||'Nama tidak tercatat'}</span></th>
  <td>{attendanceKind[r.kind]||r.kind}{pendingOnly&&<span className="staff-attendance-secondary">{r.dateKey}</span>}</td>
  <td>{r.outletName||'—'}</td>
  <td className="staff-attendance-time">{time(t.actualIn)}</td><td className="staff-attendance-time">{time(t.actualOut)}</td>
  <td><span className="staff-attendance-status">{status}</span>{notes.length>0&&<span className="staff-attendance-secondary">{notes.join(' · ')}</span>}{r.timeCorrection?.pending&&<span className="staff-attendance-pending">Menunggu keputusan koreksi</span>}</td>
  <td className="staff-attendance-action"><button type="button" className="app-button" aria-haspopup="dialog" aria-label={`Lihat detail absensi ${r.user?.name||''}`} onClick={()=>onDetails(r)}>Lihat detail</button></td>
 </tr>;
}
