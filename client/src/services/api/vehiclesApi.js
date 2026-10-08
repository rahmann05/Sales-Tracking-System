import { request } from "../httpClient";
export const vehiclesApi = {
  setCondition: (id,data) => request(`/vehicles/${id}/condition`,{method:'PATCH',body:JSON.stringify(data)}),
  getAll: async () => request('/vehicles'),
  create: async data => request('/vehicles', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: async (id, data) => request(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: async id => request(`/vehicles/${id}`, {
    method: 'DELETE'
  }),
  recordMaintenance: async (id, data) => request(`/vehicles/${id}/maintenance`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
