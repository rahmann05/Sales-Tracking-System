import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LuCircleCheck, LuCircleX, LuInfo, LuX } from 'react-icons/lu';

const TOAST_MS = 5500;

export function ToastRegion() {
  const [toasts, setToasts] = useState([]);
  const regionRef = useRef(null);
  const timersRef = useRef(new Map());
  const hoveredRef = useRef(false);

  const dismiss = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const scheduleDismiss = useCallback(
    (id) => {
      const existing = timersRef.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        if (hoveredRef.current || regionRef.current?.contains(document.activeElement)) {
          scheduleDismiss(id);
          return;
        }
        dismiss(id);
      }, TOAST_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    const onToast = (event) => {
      const detail = event.detail;
      if (!detail?.message) return;
      const item = {
        id: detail.id || `${Date.now()}-${Math.random()}`,
        tone: detail.tone || 'info',
        message: String(detail.message),
      };
      setToasts((prev) => [...prev.slice(-3), item]);
      scheduleDismiss(item.id);
      if (typeof document.ariaNotify === 'function') {
        document.ariaNotify(item.message);
      }
    };
    window.addEventListener('app:toast', onToast);
    return () => {
      window.removeEventListener('app:toast', onToast);
      for (const timer of timersRef.current.values()) clearTimeout(timer);
      timersRef.current.clear();
    };
  }, [scheduleDismiss]);

  useEffect(() => {
    const el = regionRef.current;
    if (!el || typeof el.showPopover !== 'function') return;
    try {
      if (toasts.length > 0 && !el.matches(':popover-open')) el.showPopover();
      if (toasts.length === 0 && el.matches(':popover-open')) el.hidePopover();
    } catch {}
  }, [toasts.length]);

  const iconForTone = (tone) => {
    if (tone === 'success') return <LuCircleCheck className="text-emerald-600 shrink-0 mt-0.5" />;
    if (tone === 'error') return <LuCircleX className="text-red-600 shrink-0 mt-0.5" />;
    return <LuInfo className="text-primary shrink-0 mt-0.5" />;
  };

  return (
    <div
      ref={regionRef}
      role="region"
      aria-label="Notifikasi"
      aria-live="polite"
      popover="manual"
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
      className={`app-toast-region ${toasts.length ? 'app-toast-open' : ''}`}
    >
      {toasts.map((toast) => (
        <div key={toast.id} data-tone={toast.tone} className="app-toast-card">
          <div className="flex items-start gap-2.5 min-w-0">
            {iconForTone(toast.tone)}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            className="app-toast-close"
            aria-label="Tutup notifikasi"
            onClick={() => dismiss(toast.id)}
          >
            <LuX />
          </button>
        </div>
      ))}
    </div>
  );
}
