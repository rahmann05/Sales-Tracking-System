import { request } from "../httpClient";
import { queryString } from "./helpers";
export const absensiApi = {
  getManualSales: params => request(`/absensi/manual-sales?${queryString(params)}`),
  reviewManualSales: (kind, id, decision, note) => request(`/absensi/manual-sales/${kind}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      decision,
      note
    })
  }),
  checkIn: async (pjpStopId, {
    latitude,
    longitude,
    photoUrl,
    notes
  }) => {
    return await request(`/absensi/${pjpStopId}/in`, {
      method: 'POST',
      body: JSON.stringify({
        latitude,
        longitude,
        photoUrl,
        notes
      })
    });
  },
  checkOut: async (pjpStopId, payload = {}) => {
    return await request(`/absensi/${pjpStopId}/out`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  submitOffPjp: async payload => {
    return await request('/absensi/off-pjp', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getOffPjpList: async (params = {}) => {
    const query = queryString(params);
    return await request(`/absensi/off-pjp${query ? `?${query}` : ''}`);
  },
  validateOffPjp: async (id, approved, rejectionNote) => {
    return await request(`/absensi/off-pjp/${id}/validate`, {
      method: 'PATCH',
      body: JSON.stringify({
        approved,
        rejectionNote
      })
    });
  }
};
