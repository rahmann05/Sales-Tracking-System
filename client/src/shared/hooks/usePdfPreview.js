import { useCallback, useEffect, useRef, useState } from 'react';
import { assertExportAllowed } from '../../services/operationalExportService';
import { notifyError } from '../../services/notificationService';
import { buildBlueprintPdfPreview } from '../../utils/export/core/previewPdf';

/**
 * Membuat PDF pratinjau (builder yang sama dengan ekspor) dan menyediakan fungsi cetak.
 * - `blueprint` : isi dokumen; atau `loadPdf` : pembuat PDF khusus (harus stabil / di-memo)
 * - `enabled`   : false menunda pembuatan sampai datanya siap
 */
export function usePdfPreview({ blueprint, loadPdf, domain = 'REPORTS', enabled = true }) {
  const iframeRef = useRef(null);
  const [pdf, setPdf] = useState({ url: '', filename: 'Dokumen.pdf', warning: '' });
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    let objectUrl = '';
    setLoading(true);
    setError('');
    setPdf((previous) => ({ ...previous, url: '', warning: '' }));
    (loadPdf ? loadPdf() : buildBlueprintPdfPreview(blueprint))
      .then(({ blob, filename, photoWarning }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPdf({ url: objectUrl, filename, warning: photoWarning || '' });
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Gagal membuat dokumen PDF.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [blueprint, loadPdf, enabled]);

  const print = useCallback(async () => {
    try {
      await assertExportAllowed(domain);
    } catch (err) {
      notifyError(err?.message || 'Gagal mencetak dokumen.');
      return;
    }
    const win = iframeRef.current?.contentWindow;
    if (win) {
      win.focus();
      win.print();
    } else if (pdf.url) {
      window.open(pdf.url, '_blank', 'noopener,noreferrer');
    }
  }, [domain, pdf.url]);

  return { iframeRef, pdf, loading, error, ready: Boolean(pdf.url) && !loading && !error, print };
}
