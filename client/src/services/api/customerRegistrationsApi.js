import { request } from "../httpClient";
export const customerRegistrationsApi = {
  revise:(id,body)=>request(`/customer-registrations/${id}/revise`,{method:'POST',body:JSON.stringify(body)}),
  update:(id,body)=>request(`/customer-registrations/${id}`,{method:'PATCH',body:JSON.stringify(body)}),
  getAll: async (params = {}) => {
    const cleanParams = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'undefined') {
        cleanParams[k] = v;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return await request(`/customer-registrations${query ? `?${query}` : ''}`);
  },
  searchPlaces: async (q, lat, lng) => {
    const params = new URLSearchParams({
      q
    });
    if (lat) params.append('lat', lat);
    if (lng) params.append('lng', lng);
    return await request(`/customer-registrations/search-places?${params.toString()}`);
  },
  reverseGeocode: async (lat, lng) => {
    return await request(`/customer-registrations/reverse-geocode?lat=${lat}&lng=${lng}`);
  },
  getById: async id => {
    return await request(`/customer-registrations/${id}`);
  },
  create: async data => {
    return await request('/customer-registrations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  approve: async (id, note = '') => {
    return await request(`/customer-registrations/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({
        note
      })
    });
  },
  reject: async (id, reason) => {
    return await request(`/customer-registrations/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({
        reason
      })
    });
  },
  finalize: async (id, data) => {
    return await request(`/customer-registrations/${id}/finalize`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
