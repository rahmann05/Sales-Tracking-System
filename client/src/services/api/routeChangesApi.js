import { request } from "../httpClient";
import { queryString } from "./helpers";
export const routeChangesApi = {
  replacements:(id,query={})=>request(`/route-changes/${id}/replacements?${queryString(query)}`),
  assignmentOptions:id=>request(`/route-changes/${id}/assignment`),
  assignReview:(id,body)=>request(`/route-changes/${id}/assignment`,{method:'PUT',body:JSON.stringify(body)}),
  rejectReroute: id => request(`/route-changes/${id}/reject`,{method:'PATCH'}),
  reportClosed: async ({
    pjpId,
    pjpStopId,
    reason,
    photoUrl
  }) => {
    return await request('/route-changes', {
      method: 'POST',
      body: JSON.stringify({
        pjpId,
        pjpStopId,
        reason,
        photoUrl
      })
    });
  },
  skip: async id => {
    return await request(`/route-changes/${id}/skip`, {
      method: 'POST'
    });
  },
  reroute: async (id, replacementOutletId, reason) => {
    return await request(`/route-changes/${id}/reroute`, {
      method: 'POST',
      body: JSON.stringify({
        replacementOutletId,
        reason
      })
    });
  },
  approveReroute: async id => {
    return await request(`/route-changes/${id}/approve`, {
      method: 'PATCH'
    });
  },
  getAll: async (params = {}) => {
    const query = queryString(params);
    return await request(`/route-changes${query ? `?${query}` : ''}`);
  }
};
