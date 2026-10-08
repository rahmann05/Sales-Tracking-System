import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
export function NativeDialog({open,title,children,onClose,busy=false,className=''}) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(()=>{
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return ()=>{
      if (dialog.open) dialog.close();
      if (open && previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
    };
  },[open]);
  if (typeof document==='undefined') return null;
  return createPortal(<dialog ref={ref} className={`app-dialog ${className}`} aria-labelledby={titleId} onCancel={e=>{e.preventDefault();if(!busy) onClose();}} onClick={e=>{if(e.target===e.currentTarget && !busy) {const box=e.currentTarget.getBoundingClientRect();if(e.clientX<box.left || e.clientX>box.right || e.clientY<box.top || e.clientY>box.bottom) onClose();}}}>
    <div className="app-dialog-heading"><h2 id={titleId}>{title}</h2><button type="button" aria-label="Tutup dialog" onClick={onClose} disabled={busy}>×</button></div>
    <div className="app-dialog-body">{open?children:null}</div>
  </dialog>,document.body);
}
