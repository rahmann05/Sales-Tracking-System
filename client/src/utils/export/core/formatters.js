const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function formatCurrency(value, withPrefix = true) {
  const num = Number(value);
  if (!Number.isFinite(num)) return withPrefix ? 'Rp 0' : '0';
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num));
  return withPrefix ? `Rp ${formatted}` : formatted;
}

export function formatNumber(value, decimals = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatDateId(dateInput) {
  if (!dateInput) return '-';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTimeId(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())} WIB`;
}

export function safeStr(val, fallback = '-') {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  return s.length > 0 ? s : fallback;
}

export function sanitizeFilename(name) {
  return String(name || 'Dokumen')
    .replace(/[^a-zA-Z0-9_\-.]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function formatReportBasisNotes(basis) {
  if (!basis) return [];
  const notes = [
    basis.note,
    basis.targetNote,
    basis.calendarNote,
    basis.archiveNote,
    basis.channelNote,
    basis.policyNote,
  ].filter(Boolean);
  if (basis.unassignedCount > 0) {
    notes.push(
      `${basis.unassignedCount} rencana/pengajuan kunjungan belum memiliki konteks penugasan historis yang terverifikasi.`
    );
  }
  return notes;
}
