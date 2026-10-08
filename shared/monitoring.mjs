export const DATA_STALE_MS = 150000;
export function syncHealth(state, now = Date.now(), online = true) {
  if (!online) return 'OFFLINE';
  if (state?.error) return 'ERROR';
  if (!state?.lastSuccessAt) return 'WAITING';
  return now - new Date(state.lastSuccessAt).getTime() > DATA_STALE_MS ? 'STALE' : 'CURRENT';
}
export function mapNotification(item) {
  return { ...item, source: 'SERVER', read: item.isRead, timestamp: new Date(item.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' WIB' };
}
