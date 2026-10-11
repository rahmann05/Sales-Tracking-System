import { request } from "../httpClient";
export const vehiclesApi = {
  setCapacity:(id,data)=>request(`/vehicles/${id}/capacity`,{method:'PATCH',body:JSON.stringify(data)}),
  mileage:id=>request(`/vehicles/${id}/mileage`),
  correctMileage:(id,data)=>request(`/vehicles/${id}/mileage`,{method:'PATCH',body:JSON.stringify(data)}),
  setServicePolicy:(id,data)=>request(`/vehicles/${id}/service-policy`,{method:'PATCH',body:JSON.stringify(data)}),
  setPhoto:(id,photoUrl)=>request(`/vehicles/${id}/photo`,{method:'PATCH',body:JSON.stringify({photoUrl})}),
  getServiceReceipt:(id,recordId)=>request(`/vehicles/${id}/service-records/${recordId}/receipt`),
  getById:id=>request(`/vehicles/${id}`),
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

