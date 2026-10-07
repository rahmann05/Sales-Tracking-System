import { request } from "../httpClient";
export const staffAttendanceApi = {
  getFollowUps: () => request('/staff-attendance/follow-ups'),
  completeFollowUp: (id, note) => request(`/staff-attendance/follow-ups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      note
    })
  }),
  getToday: () => request('/staff-attendance'),
  record: data => request('/staff-attendance', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  report: date => request(`/staff-attendance/report?date=${encodeURIComponent(date)}`)
};
