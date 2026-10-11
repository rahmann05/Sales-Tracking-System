import { request } from './httpClient';
import { notifyError } from './notificationService';

async function checkAllowed(domain) {
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof localStorage === 'undefined') {
    return true;
  }
  if (!localStorage.getItem('token')) return true;
  try {
    const res = await request(`/config/access/export?domain=${encodeURIComponent(domain)}`);
    return res?.data?.allowed !== false;
  } catch (error) {
    if (error?.status === 403) {
      notifyError(error.message || 'Izin ekspor ditolak.');
      return false;
    }
    return true;
  }
}

export function downloadOperationalFile(content, filename, mimeType = 'application/octet-stream', domain = 'REPORT') {
  if (typeof globalThis.__EXPORT_CAPTURE__ === 'function') {
    globalThis.__EXPORT_CAPTURE__({ content, filename, mimeType, domain });
  }
  if (typeof document === 'undefined') return true;

  const BlobClass = typeof Blob !== 'undefined' ? Blob : globalThis.Blob;
  const blob = content instanceof BlobClass ? content : new BlobClass([content], { type: mimeType });
  const URLObj = typeof URL !== 'undefined' ? URL : globalThis.URL;
  const url = URLObj.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  if (document.body?.appendChild) document.body.appendChild(link);
  link.click();
  if (document.body?.removeChild) document.body.removeChild(link);
  setTimeout(() => URLObj.revokeObjectURL(url), 1000);

  checkAllowed(domain)
    .then((allowed) => {
      if (!allowed) {
        notifyError('Peringatan: Hak akses ekspor tidak aktif untuk domain ini.');
      }
    })
    .catch(() => {});

  return true;
}

export async function printOperationalDocument(domain = 'REPORT') {
  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    const allowed = await checkAllowed(domain);
    if (allowed) window.print();
  }
}
