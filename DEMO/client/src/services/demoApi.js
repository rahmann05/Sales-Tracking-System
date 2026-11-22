async function requestDemo(path, options = {}) {
  const response = await fetch(`/api/demo${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Permintaan demo gagal (${response.status})`);
  }
  return payload;
}

export const demoApi = {
  getStatus: () => requestDemo('/status'),
  getAccounts: () => requestDemo('/accounts'),
  switchAccount: (userId) =>
    requestDemo('/switch-account', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  applyPolicy: (groups) =>
    requestDemo('/policy/apply', {
      method: 'POST',
      body: JSON.stringify({ groups }),
    }),
  restorePolicy: () =>
    requestDemo('/policy/restore', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  syncTodayPjp: ({ salesId = null, rebuild = false } = {}) =>
    requestDemo('/sync-today-pjp', {
      method: 'POST',
      body: JSON.stringify({ salesId, rebuild }),
    }),
};
