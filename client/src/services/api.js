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
    if (res?.data?.token) {
      setAuthToken(res.data.token);
    }
    return res.data;
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
  checkOut: async (pjpStopId, { latitude, longitude, photoUrl, notes }) => {
    return await request(`/absensi/${pjpStopId}/out`, {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, photoUrl, notes }),
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
