/** Shared helpers for daily-calls services (internal). */

export { wibDayRange as buildDayRange } from '../../../../../shared/visit-metrics.mjs';

export function formatTimeOnly(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });
}


export function formatDurationHhMm(mins) {
  if (mins === null || mins === undefined || isNaN(mins)) return '00:00';
  const totalSec = Math.round(mins * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
