import { request } from "../httpClient";
import { queryString } from "./helpers";
export const deliveryApi = {
  receiveReturn: (id, note) => request(`/delivery/stops/${id}/return`, {
    method: 'POST',
    body: JSON.stringify({
      note
    })
  }),
  updatePackingList: (id, data) => request(`/delivery/packing-lists/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  changePackingStatus: (id, action) => request(`/delivery/packing-lists/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      action
    })
  }),
  getPackingLists: async (params = {}) => {
    const query = queryString(params);
    return await request(`/delivery/packing-lists${query ? `?${query}` : ''}`);
  },
  getPackingListById: async id => {
    return await request(`/delivery/packing-lists/${id}`);
  },
  createPackingList: async data => {
    return await request('/delivery/packing-lists', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  deletePackingList: async id => {
    return await request(`/delivery/packing-lists/${id}`, {
      method: 'DELETE'
    });
  },
  getDeliveryRoutes: async (params = {}) => {
    const query = queryString(params);
    return await request(`/delivery/routes${query ? `?${query}` : ''}`);
  },
  getDeliveryRouteById: async id => {
    return await request(`/delivery/routes/${id}`);
  },
  createDeliveryRoute: async data => {
    return await request('/delivery/routes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateRouteStatus: async (id, status) => {
    return await request(`/delivery/routes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status
      })
    });
  },
  deleteDeliveryRoute: async id => {
    return await request(`/delivery/routes/${id}`, {
      method: 'DELETE'
    });
  },
  submitDriverAttendance: async (stopId, data) => {
    return await request(`/delivery/stops/${stopId}/attendance`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateStopStatus: async (stopId, data) => {
    return await request(`/delivery/stops/${stopId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  getDashboard: async (params = {}) => {
    const query = queryString(params);
    return await request(`/delivery/dashboard${query ? `?${query}` : ''}`);
  },
  getDrivers: async () => {
    return await request('/delivery/drivers');
  }
};
