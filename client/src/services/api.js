/**
 * Unified Backend API Service
 * Single Responsibility: Handle all HTTP network communication with Express & Prisma REST API.
 * Includes token storage, automatic Bearer headers, and error handling.
 */

const API_BASE = '/api/v1';

// Token Management
export const getAuthToken = () => localStorage.getItem('token') || '';
export const setAuthToken = (token) => {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
};

/**
 * Universal Fetch wrapper with automatic JSON and Bearer auth headers
 */
const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      setAuthToken('');
      localStorage.removeItem('authUser');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    const errorMsg = data?.message || data?.errors?.[0]?.message || `Request failed (${response.status})`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// ─── 1. Auth API ─────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email, password = 'password123') => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const token = res?.data?.accessToken || res?.data?.token;
    if (token) setAuthToken(token);
    if (res?.data?.user) localStorage.setItem('authUser', JSON.stringify(res.data.user));
    return res.data; // { user, accessToken, refreshToken }
  },
  logout: () => {
    setAuthToken('');
    localStorage.removeItem('authUser');
  },
  getStoredUser: () => {
    try { return JSON.parse(localStorage.getItem('authUser') || 'null'); } catch { return null; }
  },
};

// ─── 2. PJP & Stops API ───────────────────────────────────────────────────────
export const pjpApi = {
  getTodayPjp: async () => {
    return await request('/pjp/today');
  },
  getAllPjps: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/pjp${query ? `?${query}` : ''}`);
  },
};

// ─── 3. Absensi & Presensi API ────────────────────────────────────────────────
export const absensiApi = {
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
    const query = new URLSearchParams(params).toString();
    return await request(`/absensi/off-pjp${query ? `?${query}` : ''}`);
  },
  validateOffPjp: async (id, approved, rejectionNote) => {
    return await request(`/absensi/off-pjp/${id}/validate`, {
      method: 'PATCH',
      body: JSON.stringify({ approved, rejectionNote }),
    });
  },
};

// ─── 4. Orders API ────────────────────────────────────────────────────────────
export const ordersApi = {
  createOrder: async ({ pjpStopId, items, paymentType }) => {
    return await request('/orders', {
      method: 'POST',
      body: JSON.stringify({ pjpStopId, items, paymentType }),
    });
  },
  getAllOrders: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/orders${query ? `?${query}` : ''}`);
  },
  approveOrder: async (id) => {
    return await request(`/orders/${id}/approve`, {
      method: 'PATCH',
    });
  },
  rejectOrder: async (id, reason) => {
    return await request(`/orders/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },
};

// ─── 5. Outlets & Lock/Unlock API ─────────────────────────────────────────────
export const outletsApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
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
    const query = new URLSearchParams(params).toString();
    return await request(`/outlets/unlock-requests${query ? `?${query}` : ''}`);
  },
  handleUnlockRequest: async (requestId, approved) => {
    return await request(`/outlets/unlock-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ approved }),
    });
  },
};

// ─── 5b. Outlet Validation API ────────────────────────────────────────────────
export const outletValidationApi = {
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

// ─── 6. Route Changes / Incident API ──────────────────────────────────────────
export const routeChangesApi = {
  reportClosed: async ({ pjpId, pjpStopId, reason, photoUrl }) => {
    return await request('/route-changes', {
      method: 'POST',
      body: JSON.stringify({ pjpId, pjpStopId, reason, photoUrl }),
    });
  },
  skip: async (id) => {
    return await request(`/route-changes/${id}/skip`, {
      method: 'PATCH',
    });
  },
  reroute: async (id, replacementOutletId, reason) => {
    return await request(`/route-changes/${id}/reroute`, {
      method: 'PATCH',
      body: JSON.stringify({ replacementOutletId, reason }),
    });
  },
  approveReroute: async (id) => {
    return await request(`/route-changes/${id}/approve`, {
      method: 'PATCH',
    });
  },
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/route-changes${query ? `?${query}` : ''}`);
  },
};

// ─── 7. Clusters API ─────────────────────────────────────────────────────────
export const clustersApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
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

// ─── 8. Users & Live GPS Tracking API ─────────────────────────────────────────
export const usersApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await request(`/users${query ? `?${query}` : ''}`);
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

// ─── 9. Legacy apiService Compatibility ───────────────────────────────────────
export const apiService = {
  getHealth: async () => request('/health'),
  getUsers: async () => request('/users'),
};

// ─── 10. Vehicles API ─────────────────────────────────────────────────────────
export const vehiclesApi = {
  getAll: async () => request('/vehicles'),
  create: async (data) => request('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id, data) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),
};

// ─── 11. Config API ───────────────────────────────────────────────────────────
export const configApi = {
  getByKey: async (key) => request(`/config/${key}`),
  updateByKey: async (key, value) => request(`/config/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
};

// ─── 12. Customer Registrations API ───────────────────────────────────────────
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

// ─── 13. Daily Calls & Monitoring API ─────────────────────────────────────────
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

// ─── 14. ND6 Reports Suite API ───────────────────────────────────────────────
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
    const query = new URLSearchParams(params).toString();
    return await request(`/reports/dashboard${query ? `?${query}` : ''}`);
  },
};

