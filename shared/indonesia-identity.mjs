export const ID_NIK_REGEX = /^\d{16}$/;
export const ID_NPWP_REGEX = /^(?:\d{15,16}|\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3})$/;
export const ID_PHONE_NORMALIZED_REGEX = /^(?:\+62|62|0)[2-9]\d{7,12}$/;

export const ID_NIK_HTML_PATTERN = '\\d{16}';
export const ID_NPWP_HTML_PATTERN = '(?:\\d{15,16}|\\d{2}\\.\\d{3}\\.\\d{3}\\.\\d-\\d{3}\\.\\d{3})';
export const ID_PHONE_HTML_PATTERN = '(?:\\+62|62|0)[\\s-]?[2-9][0-9\\-\\s]{7,13}';

export function sanitizeNikInput(raw) {
  return String(raw ?? '')
    .replace(/\D/g, '')
    .slice(0, 16);
}

export function sanitizeNpwpInput(raw) {
  return String(raw ?? '')
    .replace(/[^\d.-]/g, '')
    .slice(0, 20);
}

export function sanitizePhoneInput(raw) {
  const s = String(raw ?? '').trimStart();
  const hasPlus = s.startsWith('+');
  const cleaned = s.replace(/[^\d\s-]/g, '');
  return `${hasPlus ? '+' : ''}${cleaned}`.slice(0, 16);
}

export function normalizeIndonesianPhone(raw) {
  return String(raw ?? '')
    .trim()
    .replace(/[\s-]/g, '');
}

export function validateIndonesianTaxNumber(taxType, raw) {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  if (taxType === 'PKP') {
    return ID_NPWP_REGEX.test(value)
      ? null
      : 'Nomor NPWP harus 15 atau 16 digit angka (contoh: 01.234.567.8-901.000).';
  }
  return ID_NIK_REGEX.test(value) ? null : 'NIK harus terdiri dari tepat 16 digit angka.';
}

export function validateIndonesianPhone(raw) {
  const normalized = normalizeIndonesianPhone(raw);
  if (!normalized) return null;
  return ID_PHONE_NORMALIZED_REGEX.test(normalized)
    ? null
    : 'Nomor telepon harus format Indonesia yang valid (9–14 digit, diawali 08, 02x, atau +62).';
}
