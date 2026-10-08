import React, { useEffect, useRef } from 'react';
import { LuPackageCheck, LuX } from 'react-icons/lu';

export default function PackingReviewDialog({ open, close, release, outlet, cartons, invoices, orderId }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) { ref.current?.close(); return; }
    const previous = document.activeElement;
    ref.current?.showModal();
    return () => { ref.current?.close(); previous?.focus(); };
  }, [open]);
  return <dialog className="preview-dialog" ref={ref} onCancel={close} aria-labelledby="release-title"><div className="dialog-heading"><span className="module-icon blue"><LuPackageCheck /></span><button className="icon-button" onClick={close} aria-label="Tutup pemeriksaan rilis"><LuX /></button></div><h2 id="release-title">Rilis packing list?</h2><p>Dokumen akan masuk ke antrean persiapan gudang. Alokasi kendaraan dilakukan pada langkah berikutnya.</p><dl className="key-values"><div><dt>Tujuan</dt><dd>{outlet}</dd></div><div><dt>Sumber</dt><dd>{orderId || 'Manual'}</dd></div><div><dt>Muatan</dt><dd>{cartons} karton · {invoices} faktur</dd></div></dl><p className="simulation-note">Simulasi desain. Tidak menyimpan dokumen ke server.</p><div className="button-row"><button className="secondary" onClick={close}>Periksa lagi</button><button className="primary" onClick={release}>Rilis dokumen contoh</button></div></dialog>;
}
