import React, { useEffect, useRef } from 'react';

export default function LeaveDialog({ open, stay, leave }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) { ref.current?.close(); return; }
    const previous = document.activeElement;
    ref.current?.showModal();
    ref.current?.querySelector(".primary")?.focus();
    return () => { ref.current?.close(); previous?.focus(); };
  }, [open]);
  return <dialog className="preview-dialog" ref={ref} onCancel={stay} aria-labelledby="leave-title"><h2 id="leave-title">Tinggalkan perubahan?</h2><p>Perubahan packing list ini belum disimpan dalam sesi pratinjau.</p><div className="button-row"><button className="secondary" onClick={leave}>Tinggalkan perubahan</button><button className="primary" autoFocus onClick={stay}>Lanjutkan mengedit</button></div></dialog>;
}
