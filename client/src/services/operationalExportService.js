import { request } from './httpClient';
import {notifyError} from './notificationService';

export async function assertExportAllowed(domain = 'REPORTS') {
  const normalized = domain === 'REPORT' ? 'REPORTS' : domain;
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('token')) throw new Error('Silakan masuk kembali sebelum mengekspor dokumen.');
  const res = await request(`/config/access/export?domain=${encodeURIComponent(normalized)}`);
  if (res?.data?.allowed !== true) throw new Error('Izin ekspor belum dapat dikonfirmasi. Coba kembali.');
}

export async function downloadOperationalFile(content, filename, mimeType = 'application/octet-stream', domain = 'REPORTS') {
  await assertExportAllowed(domain);
  if (typeof globalThis.__EXPORT_CAPTURE__ === 'function') globalThis.__EXPORT_CAPTURE__({content, filename, mimeType, domain});
  if (typeof document === 'undefined') return true;
  const blob = content instanceof Blob ? content : new Blob([content], {type: mimeType});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  try {
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return true;
}

export async function printOperationalDocument(domain = 'REPORTS') {
  try {
    await assertExportAllowed(domain);
    if (typeof window !== 'undefined') window.print();
  } catch (error) {notifyError(error.message);}
}
