import React, { useEffect, useRef, useState } from 'react';
import { NativeDialog } from './NativeDialog';

/**
 * ConfirmDialogRegion
 * Non-blocking Top-Layer confirmation dialog driven by 'app:confirm' CustomEvents.
 */
export const ConfirmDialogRegion = () => {
  const [request, setRequest] = useState(null);
  const activeRef = useRef(null);

  const settle = (accepted) => {
    const current = activeRef.current;
    if (!current) return;
    activeRef.current = null;
    setRequest(null);
    current.resolve?.(Boolean(accepted));
  };

  useEffect(() => {
    const onConfirm = (event) => {
      event.preventDefault();
      if (activeRef.current) {
        activeRef.current.resolve?.(false);
      }
      const next = {
        title: event.detail?.title || 'Konfirmasi Tindakan',
        message: event.detail?.message || '',
        confirmLabel: event.detail?.confirmLabel || 'Ya, Lanjutkan',
        cancelLabel: event.detail?.cancelLabel || 'Batal',
        danger: Boolean(event.detail?.danger),
        resolve: event.detail?.resolve,
      };
      activeRef.current = next;
      setRequest(next);
    };
    window.addEventListener('app:confirm', onConfirm);
    return () => {
      window.removeEventListener('app:confirm', onConfirm);
      if (activeRef.current) {
        activeRef.current.resolve?.(false);
        activeRef.current = null;
      }
    };
  }, []);

  return (
    <NativeDialog
      open={Boolean(request)}
      title={request?.title || 'Konfirmasi'}
      onClose={() => settle(false)}
      className="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-sm text-on-surface leading-relaxed">{request?.message}</p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="btn btn-secondary min-h-11"
            onClick={() => settle(false)}
          >
            {request?.cancelLabel || 'Batal'}
          </button>
          <button
            type="button"
            className={
              request?.danger
                ? 'min-h-11 px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                : 'btn btn-primary min-h-11'
            }
            onClick={() => settle(true)}
          >
            {request?.confirmLabel || 'Ya, Lanjutkan'}
          </button>
        </div>
      </div>
    </NativeDialog>
  );
};
