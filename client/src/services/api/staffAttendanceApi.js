import { request } from "../httpClient";
export const staffAttendanceApi = {
  evidence:id=>request(`/staff-attendance/${encodeURIComponent(id)}/evidence`),
  correctShiftTime:(id,data)=>request(`/staff-attendance/${id}/time-correction`,{method:'PATCH',body:JSON.stringify(data)}),
  pendingShiftCorrections:()=>request('/staff-attendance/time-corrections'),
  scheduleFollowUp:(id,data)=>request(`/staff-attendance/follow-ups/${id}/visit`,{method:'POST',body:JSON.stringify(data)}),
  followUpCandidates:()=>request('/staff-attendance/follow-ups/candidates'),
  assignFollowUp:(id,data)=>request(`/staff-attendance/follow-ups/${id}/assignment`,{method:'PATCH',body:JSON.stringify(data)}),
  getFollowUps: ({status='OPEN',page=1}={}) => request(`/staff-attendance/follow-ups?status=${encodeURIComponent(status)}&page=${page}&limit=50`),
  reviewFollowUp:(id,data)=>request(`/staff-attendance/follow-ups/${id}/review`,{method:'POST',body:JSON.stringify(data)}),
  completeFollowUp: (id, note, evidence) => request(`/staff-attendance/follow-ups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      note,evidence
    })
  }),
  getToday: () => request('/staff-attendance'),
  record: data => request('/staff-attendance', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  report: date => request(`/staff-attendance/report?date=${encodeURIComponent(date)}`)
};
