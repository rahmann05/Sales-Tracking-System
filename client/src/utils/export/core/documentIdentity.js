/**
 * Identitas tunggal untuk semua dokumen ekspor (Word, PDF, Excel, TXT, CSV) dan pratinjaunya:
 * nama perusahaan dan penandatangan. Satu sumber agar format tidak pernah berbeda-beda.
 */
export const COMPANY_NAME = 'CV. SINAR ANUGRAH';

/** Nama perusahaan resmi. Awalan "PT" dari konfigurasi lama selalu dikoreksi menjadi "CV.". */
export function normalizeCompanyName(name) {
  const raw = String(name ?? '').trim();
  if (!raw) return COMPANY_NAME;
  return raw.replace(/^PT\.?\s+/i, 'CV. ').replace(/^CV\s+(?=\S)/i, 'CV. ');
}

let signerName = '';

/** Dipanggil saat sesi login berubah; nama akun yang sedang masuk menjadi penandatangan. */
export function setDocumentSigner(name) {
  signerName = String(name ?? '').trim();
}

/**
 * Tanda tangan dokumen laporan operasional: hanya Supervisor, bernama akun yang sedang login.
 * Tanda tangan hanya dicetak pada Word dan PDF.
 */
export function supervisorSignatories() {
  return [{ role: 'Supervisor,', name: signerName, title: '' }];
}
