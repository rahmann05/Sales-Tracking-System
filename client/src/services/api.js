const API_BASE_URL = '/api';

/**
 * Standard HTTP Fetch Wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `API Error: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error(`[API Service Error] ${endpoint}:`, error);
    throw error;
  }
}

export const apiService = {
  getHealth: () => fetchAPI('/health'),
  getUsers: () => fetchAPI('/users'),
  getUserById: (id) => fetchAPI(`/users/${id}`),
};
