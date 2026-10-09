import { request } from "../httpClient";
import { queryString } from "./helpers";
export const clustersApi = {
  teamOptions:()=>request('/clusters/team-options'),
  impact:data=>request('/clusters/impact',{method:'POST',body:JSON.stringify(data)}),
  previewImport:rows=>request('/clusters/import-preview',{method:'POST',body:JSON.stringify({rows})}),
  importRjp: (rows,impactToken) => request('/clusters/import-rjp', {
    method: 'POST',
    body: JSON.stringify({
      rows,impactToken
    })
  }),
  getAll: async (params = {}) => {
    const query = queryString(params);
    return await request(`/clusters${query ? `?${query}` : ''}`);
  },
  getById: async id => {
    return await request(`/clusters/${id}`);
  },
  create: async data => {
    return await request('/clusters', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  update: async (id, data) => {
    return await request(`/clusters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  delete: async id => {
    return await request(`/clusters/${id}`, {
      method: 'DELETE'
    });
  },
  getNearestOutlets: async (lat, lng, count, type,supervisorId) => {
    const body = {
      lat,
      lng,
      count
    };
    if (type) body.type = type;
    if (supervisorId) body.supervisorId = supervisorId;
    return await request('/clusters/nearest-outlets', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  generateRoutes: async outletIds => {
    return await request('/clusters/generate-routes', {
      method: 'POST',
      body: JSON.stringify({
        outletIds
      })
    });
  },
  createFull: async data => {
    return await request('/clusters/full', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateOutlets: async (id, outletIds,impactToken) => {
    return await request(`/clusters/${id}/outlets`, {
      method: 'PATCH',
      body: JSON.stringify({outletIds,impactToken})
    });
  },
  updateRoutes: async (id, routes) => {
    return await request(`/clusters/${id}/routes`, {
      method: 'PATCH',
      body: JSON.stringify({
        routes
      })
    });
  },
  setActiveRoute: async (id, routeIndex) => {
    return await request(`/clusters/${id}/routes/${routeIndex}/activate`, {
      method: 'PATCH'
    });
  }
};
