import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
export function NativeDialog({ open, title, children, onClose, busy = false, className = '' }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    const previousFocus = document.activeElement;
    if (open && !dialog.open && typeof dialog.showModal === 'function') dialog.showModal();
    if (!open && dialog.open && typeof dialog.close === 'function') dialog.close();
    return () => {
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
      if (open && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  const dialogNode = (
    <dialog
      ref={ref}
      open={typeof document === 'undefined' ? Boolean(open) : undefined}
      className={`app-dialog ${className}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!busy) onClose?.();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) {
          const box = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom
          ) {
            onClose?.();
          }
        }
      }}
    >
      <div className="app-dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <button type="button" aria-label="Tutup dialog" onClick={() => onClose?.()} disabled={busy}>
          ×
        </button>
      </div>
      <div className="app-dialog-body">{open ? children : null}</div>
    </dialog>
  );

  if (typeof document === 'undefined') {
    return open ? dialogNode : null;
  }
  return createPortal(dialogNode, document.body);
}
