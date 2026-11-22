/**
 * Notification Service
 * Single Responsibility: Centralize non-blocking toast notifications via Top-Layer ToastRegion.
 */

const emitToast = (tone, message) => {
  if (!message || typeof window === 'undefined') return;
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  window.dispatchEvent(
    new CustomEvent('app:toast', { detail: { id, tone, message: String(message) } })
  );
};

export const notifySuccess = (message) => emitToast('success', message);
export const notifyError = (message) => emitToast('error', `Error: ${message}`);
export const notifyInfo = (message) => emitToast('info', message);

export const confirmAction = (message, options = {}) => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    const event = new CustomEvent('app:confirm', {
      cancelable: true,
      detail: { ...options, message: String(message || ''), resolve },
    });
    const notHandled = window.dispatchEvent(event);
    if (notHandled) {
      resolve(window.confirm(String(message || '')));
    }
  });
};
