import { request } from "../httpClient";
import { queryString } from "./helpers";
export const deliveryApi = {
  correctInvoiceCommercial:(id,data)=>request(`/delivery/packing-lists/${id}/invoices`,{method:'PATCH',body:JSON.stringify(data)}),
  reconcileInvoiceReceipt:(id,data)=>request(`/delivery/packing-lists/${id}/reconciliation`,{method:'POST',body:JSON.stringify(data)}),
  getOperations: (params={}) => request(`/delivery/operations?${queryString(params)}`),
  getMyIssues: () => request('/delivery/my-issues'),
  routeAction: (id,data) => request(`/delivery/routes/${id}/actions`,{method:'POST',body:JSON.stringify(data)}),
  reportLocation: (id,data) => request(`/delivery/routes/${id}/location`,{method:'POST',body:JSON.stringify(data)}),
  createIssue: data => request('/delivery/issues',{method:'POST',body:JSON.stringify(data)}),
  resolveIssue: (id,resolution) => request(`/delivery/issues/${id}/resolve`,{method:'PATCH',body:JSON.stringify({resolution})}),
  setOrderPromise: (id,data) => request(`/orders/${id}/promise`,{method:'PATCH',body:JSON.stringify(data)}),
  receiveReturn: (id, data) => request(`/delivery/stops/${id}/return`, {
    method: 'POST',
    body: JSON.stringify(data)
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
