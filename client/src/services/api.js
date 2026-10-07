import { request, saveSession, clearSession } from './httpClient';
export { getAuthToken, setAuthToken } from './httpClient';

// â”€â”€â”€ 1. Auth API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const queryString = params => new URLSearchParams(Object.entries(params || {}).filter(([,value])=>value!==undefined && value!==null && value!=='')).toString();

export const authApi = {
  me: () => request('/auth/me'),
  login: async (email, password = 'password123') => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveSession(res.data);
    return res.data; // { user, accessToken, refreshToken }
  },
  logout: () => {
    clearSession();
  },
  getStoredUser: () => {
    try { return JSON.parse(localStorage.getItem('authUser') || 'null'); } catch { return null; }
  },
};

// â”€â”€â”€ 2. PJP & Stops API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const pjpApi = {
  getTemplates: () => request('/pjp/templates'),
  saveTemplates: templates => request('/pjp/templates', {method:'PUT',body:JSON.stringify({templates})}),
  getTodayPjp: async () => {
    return await request('/pjp/today');
  },
  getAllPjps: async (params = {}) => {
    const query = queryString(params);
    return await request(`/pjp${query ? `?${query}` : ''}`);
  },
};

// â”€â”€â”€ 3. Absensi & Presensi API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const absensiApi = {
  getManualSales: params => request(`/absensi/manual-sales?${queryString(params)}`),
  reviewManualSales: (kind,id,decision,note) => request(`/absensi/manual-sales/${kind}/${id}`, { method: 'PATCH', body: JSON.stringify({ decision,note }) }),
  checkIn: async (pjpStopId, { latitude, longitude, photoUrl, notes }) => {
    return await request(`/absensi/${pjpStopId}/in`, {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, photoUrl, notes }),
    });
  },
  checkOut: async (pjpStopId, payload = {}) => {
    return await request(`/absensi/${pjpStopId}/out`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  submitOffPjp: async (payload) => {
    return await request('/absensi/off-pjp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getOffPjpList: async (params = {}) => {
    const query = queryString(params);
    return await request(`/absensi/off-pjp${query ? `?${query}` : ''}`);
  },
  validateOffPjp: async (id, approved, rejectionNote) => {
    return await request(`/absensi/off-pjp/${id}/validate`, {
      method: 'PATCH',
      body: JSON.stringify({ approved, rejectionNote }),
    });
  },
};

// â”€â”€â”€ 4. Orders API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const ordersApi = {
  createOrder: async ({ pjpStopId, items, paymentType }) => {
    return await request('/orders', {
      method: 'POST',
      body: JSON.stringify({ pjpStopId, items, paymentType }),
    });
  },
  getAllOrders: async (params = {}) => {
    const query = queryString(params);
    return await request(`/orders${query ? `?${query}` : ''}`);
  },
  approveOrder: async (id) => {
    return await request(`/orders/${id}/approve`, {
      method: 'PATCH',
    });
  },
  batchApproveOrders: async (orderIds) => {
    return await request('/orders/batch-approve', {
      method: 'PATCH',
      body: JSON.stringify({ orderIds }),
    });
  },
  rejectOrder: async (id, reason) => {
    return await request(`/orders/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },
};

// â”€â”€â”€ 4b. Products API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const productsApi = {
  getAll: async (params = {}) => {
    const query = queryString(params);
    return await request(`/products${query ? `?${query}` : ''}`);
  },
  getById: async (id) => {
    return await request(`/products/${id}`);
  },
  create: async (data) => {
    return await request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return await request(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  remove: async (id) => {
    return await request(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// â”€â”€â”€ 5. Outlets & Lock/Unlock API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const outletsApi = {
  getAll: async (params = {}) => {
    const query = queryString(params);
    return await request(`/outlets${query ? `?${query}` : ''}`);
  },
  create: async (outletData) => {
    return await request('/outlets', {
      method: 'POST',
      body: JSON.stringify(outletData),
    });
  },
  update: async (id, outletData) => {
    return await request(`/outlets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(outletData),
    });
  },
  remove: async (id) => {
    return await request(`/outlets/${id}`, {
      method: 'DELETE',
    });
  },
  requestUnlock: async (outletId, reason) => {
    return await request(`/outlets/${outletId}/unlock-request`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
  getUnlockRequests: async (params = {}) => {
    const query = queryString(params);
    return await request(`/outlets/unlock-requests${query ? `?${query}` : ''}`);
  },
  handleUnlockRequest: async (requestId, approved) => {
    return await request(`/outlets/unlock-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ approved }),
    });
  },
};

// â”€â”€â”€ 5b. Outlet Validation API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const outletValidationApi = {
  correctCoordinates: (id,body) => request(`/outlets/${id}/coordinates`,{method:'PATCH',body:JSON.stringify(body)}),
  validateSingle: async (outletId) => {
    return await request(`/outlets/${outletId}/validate`, { method: 'POST' });
  },
  validateBatch: async ({ outletIds, filter, limit } = {}) => {
    return await request('/outlets/batch-validate', {
      method: 'POST',
      body: JSON.stringify({ outletIds, filter, limit }),
    });
  },
  validateNearby: async (outletId) => {
    return await request(`/outlets/${outletId}/validate-nearby`, { method: 'POST' });
  },
  getSummary: async () => {
    return await request('/outlets/validation-summary');
  },
};

// â”€â”€â”€ 6. Route Changes / Incident API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const routeChangesApi = {
  reportClosed: async ({ pjpId, pjpStopId, reason, photoUrl }) => {
    return await request('/route-changes', {
      method: 'POST',
      body: JSON.stringify({ pjpId, pjpStopId, reason, photoUrl }),
    });
  },
  skip: async (id) => {
    return await request(`/route-changes/${id}/skip`, {
      method: 'POST',
    });
  },
  reroute: async (id, replacementOutletId, reason) => {
    return await request(`/route-changes/${id}/reroute`, {
      method: 'POST',
      body: JSON.stringify({ replacementOutletId, reason }),
    });
  },
  approveReroute: async (id) => {
    return await request(`/route-changes/${id}/approve`, {
      method: 'PATCH',
    });
  },
  getAll: async (params = {}) => {
    const query = queryString(params);
    return await request(`/route-changes${query ? `?${query}` : ''}`);
  },
};

// â”€â”€â”€ 7. Clusters API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const clustersApi = {
  importRjp: rows=>request('/clusters/import-rjp',{method:'POST',body:JSON.stringify({rows})}),
  getAll: async (params = {}) => {
    const query = queryString(params);
    return await request(`/clusters${query ? `?${query}` : ''}`);
  },
  getById: async (id) => {
    return await request(`/clusters/${id}`);
  },
  create: async (data) => {
    return await request('/clusters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return await request(`/clusters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete: async (id) => {
    return await request(`/clusters/${id}`, {
      method: 'DELETE',
    });
  },

  // New Map-based Builder endpoints
  getNearestOutlets: async (lat, lng, count, type) => {
    const body = { lat, lng, count };
    if (type) body.type = type;
    return await request('/clusters/nearest-outlets', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  generateRoutes: async (outletIds) => {
    return await request('/clusters/generate-routes', {
      method: 'POST',
      body: JSON.stringify({ outletIds }),
    });
  },
  createFull: async (data) => {
    return await request('/clusters/full', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateOutlets: async (id, outletIds) => {
    return await request(`/clusters/${id}/outlets`, {
      method: 'PATCH',
      body: JSON.stringify({ outletIds }),
    });
  },
  updateRoutes: async (id, routes) => {
    return await request(`/clusters/${id}/routes`, {
      method: 'PATCH',
      body: JSON.stringify({ routes }),
    });
  },
  setActiveRoute: async (id, routeIndex) => {
    return await request(`/clusters/${id}/routes/${routeIndex}/activate`, {
      method: 'PATCH',
    });
  },
};

// â”€â”€â”€ 8. Users & Live GPS Tracking API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const usersApi = {
  getAll: async (params = {}) => {
    const query = queryString(params);
    return await request(`/users${query ? `?${query}` : ''}`);
  },
  getUsers: async (params = {}) => {
    return await usersApi.getAll(params);
  },
  getById: async (id) => {
    return await request(`/users/${id}`);
  },
  create: async (userData) => {
    return await request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  update: async (id, userData) => {
    return await request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },
  remove: async (id) => {
    return await request(`/users/${id}`, {
      method: 'DELETE',
    });
  },
  updatePassword: async (id, password) => {
    return await request(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
  },
  updatePermissions: async (id, permissions) => {
    return await request(`/users/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  },
  updateLocation: async (coords) => {
    return await request('/users/location', {
      method: 'POST',
      body: JSON.stringify(coords),
    });
  },
  getLiveLocations: async () => {
    return await request('/users/live-locations');
  },
};

// â”€â”€â”€ 9. Legacy apiService Compatibility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const apiService = {
  getHealth: async () => request('/health'),
  getUsers: async () => request('/users'),
};

// â”€â”€â”€ 10. Vehicles API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const vehiclesApi = {
  getAll: async () => request('/vehicles'),
  create: async (data) => request('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id, data) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),
  recordMaintenance: async (id, data) => request(`/vehicles/${id}/maintenance`, { method: 'POST', body: JSON.stringify(data) }),
};

// â”€â”€â”€ 11. Config API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const configApi = {
  getRuntime: async () => request('/config/runtime'),
  getAll: async () => request('/config'),
  getByKey: async (key) => request(`/config/${key}`),
  updateByKey: async (key, value) => request(`/config/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  bulkUpdate: async (configs) => request('/config', { method: 'PUT', body: JSON.stringify({ configs }) }),
};

// â”€â”€â”€ 12. Customer Registrations API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const customerRegistrationsApi = {
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
    const params = new URLSearchParams({ q });
    if (lat) params.append('lat', lat);
    if (lng) params.append('lng', lng);
    return await request(`/customer-registrations/search-places?${params.toString()}`);
  },
  reverseGeocode: async (lat, lng) => {
    return await request(`/customer-registrations/reverse-geocode?lat=${lat}&lng=${lng}`);
  },
  getById: async (id) => {
    return await request(`/customer-registrations/${id}`);
  },
  create: async (data) => {
    return await request('/customer-registrations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  approve: async (id, note = '') => {
    return await request(`/customer-registrations/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    });
  },
  reject: async (id, reason) => {
    return await request(`/customer-registrations/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },
  finalize: async (id, data) => {
    return await request(`/customer-registrations/${id}/finalize`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// â”€â”€â”€ 13. Daily Calls & Monitoring API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const dailyCallsApi = {
  getReport: async (params = {}) => {
    const cleanParams = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'undefined') {
        cleanParams[k] = v;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return await request(`/daily-calls${query ? `?${query}` : ''}`);
  },
};

// â”€â”€â”€ 14. ND6 Reports Suite API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const reportsApi = {
  getWeekly: async (params = {}) => {
    const cleanParams = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'undefined') {
        cleanParams[k] = v;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return await request(`/reports/weekly${query ? `?${query}` : ''}`);
  },
  getMtd: async (params = {}) => {
    const cleanParams = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'undefined') {
        cleanParams[k] = v;
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return await request(`/reports/mtd${query ? `?${query}` : ''}`);
  },
  getDashboard: async (params = {}) => {
    const query = queryString(params);
    return await request(`/reports/dashboard${query ? `?${query}` : ''}`);
  },
};
// â”€â”€â”€ 15. Divisions API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const divisionsApi = {
  getAll: async ({ includeInactive = false } = {}) => {
    const query = includeInactive ? '?includeInactive=true' : '';
    return await request(`/divisions${query}`);
  },
  create: async ({ name, code }) => {
    return await request('/divisions', {
      method: 'POST',
      body: JSON.stringify({ name, code }),
    });
  },
  update: async (id, data) => {
    return await request(`/divisions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete: async (id) => {
    return await request(`/divisions/${id}`, { method: 'DELETE' });
  },
};

// â”€â”€â”€ 16. Delivery Management API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const deliveryApi = {
  receiveReturn: (id,note) => request(`/delivery/stops/${id}/return`,{method:'POST',body:JSON.stringify({note})}),
    updatePackingList: (id, data) => request(`/delivery/packing-lists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    changePackingStatus: (id, action) => request(`/delivery/packing-lists/${id}/status`, { method: 'PATCH', body: JSON.stringify({ action }) }),
  // Packing Lists
  getPackingLists: async (params = {}) => {
    const query = queryString(params);
    return await request(`/delivery/packing-lists${query ? `?${query}` : ''}`);
  },
  getPackingListById: async (id) => {
    return await request(`/delivery/packing-lists/${id}`);
  },
  createPackingList: async (data) => {
    return await request('/delivery/packing-lists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  deletePackingList: async (id) => {
    return await request(`/delivery/packing-lists/${id}`, { method: 'DELETE' });
  },

  // Delivery Routes
  getDeliveryRoutes: async (params = {}) => {
    const query = queryString(params);
    return await request(`/delivery/routes${query ? `?${query}` : ''}`);
  },
  getDeliveryRouteById: async (id) => {
    return await request(`/delivery/routes/${id}`);
  },
  createDeliveryRoute: async (data) => {
    return await request('/delivery/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateRouteStatus: async (id, status) => {
    return await request(`/delivery/routes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  deleteDeliveryRoute: async (id) => {
    return await request(`/delivery/routes/${id}`, { method: 'DELETE' });
  },

  // Driver Attendance
  submitDriverAttendance: async (stopId, data) => {
    return await request(`/delivery/stops/${stopId}/attendance`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateStopStatus: async (stopId, data) => {
    return await request(`/delivery/stops/${stopId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Dashboard & Utility
  getDashboard: async (params = {}) => {
    const query = queryString(params);
    return await request(`/delivery/dashboard${query ? `?${query}` : ''}`);
  },
  getDrivers: async () => {
    return await request('/delivery/drivers');
  },
};

// â”€â”€â”€ 17. Roles & Permissions API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const rolesApi = {
  getAll: async () => {
    return await request('/roles');
  },
  getByCode: async (code) => {
    return await request(`/roles/${code}`);
  },
  create: async (data) => {
    return await request('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (code, data) => {
    return await request(`/roles/${code}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (code) => {
    return await request(`/roles/${code}`, {
      method: 'DELETE',
    });
  },
  getPermissions: async () => {
    return await request('/roles/permissions');
  },
};


export const staffAttendanceApi = {
  getFollowUps: () => request('/staff-attendance/follow-ups'),
  completeFollowUp: (id,note) => request(`/staff-attendance/follow-ups/${id}`,{method:'PATCH',body:JSON.stringify({note})}),
  getToday: () => request('/staff-attendance'),
  record: data => request('/staff-attendance', { method: 'POST', body: JSON.stringify(data) }),
  report: date => request(`/staff-attendance/report?date=${encodeURIComponent(date)}`),
};

export async function collectPages(fetchPage, params = {}) {
  const list=[],seen=new Set();
  const started=Date.now();
  for(let page=1;page<=200;page++) {
    if(Date.now()-started>60000)throw new Error('Pengambilan data melebihi batas waktu. Persempit filter lalu coba kembali.');
    const response=await fetchPage({...params,page,limit:100});
    const body=response.data ?? response;
    const rows=Array.isArray(body)?body:body.data || body.items || [];
    if(!Array.isArray(rows))throw new Error('Format daftar dari server tidak valid.');
    const pagination=body.pagination || response.pagination;
    const more=Boolean(pagination?.hasNextPage || pagination?.totalPages>page);
    if(more&&(!rows.length || rows.every(row=>row.id && seen.has(row.id))))throw new Error('Pagination server tidak bergerak. Muat ulang atau persempit filter.');
    list.push(...rows);rows.forEach(row=>{if(row.id)seen.add(row.id);});
    if(!more)return {data:list};
  }
  throw new Error('Daftar terlalu besar. Persempit filter sebelum memuat kembali.');
}

export const teamsApi = {
  getAll: () => request('/teams'),
  assign: (id,body) => request(`/teams/${id}`,{method:'PATCH',body:JSON.stringify(body)}),
};
