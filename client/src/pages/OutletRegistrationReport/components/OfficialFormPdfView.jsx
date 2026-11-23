import React, { useEffect, useRef, useState } from 'react';
import { LuDownload, LuLoader, LuPrinter, LuX } from 'react-icons/lu';
import { assertExportAllowed } from '../../../services/operationalExportService';
import { notifyError } from '../../../services/notificationService';
import { ExportFormatMenu } from '../../../shared/components/common/ExportFormatMenu';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';
import {
  buildNooPdfPreview,
  exportNooCsv,
  exportNooDocx,
  exportNooExcel,
  exportNooPdf,
  exportNooTxt,
} from '../../../utils/export/documents/nooDocumentExport';

export const OfficialFormPdfView = ({ data, onClose }) => {
  const iframeRef = useRef(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfFilename, setPdfFilename] = useState('Formulir_NOO.pdf');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoWarning, setPhotoWarning] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!data) return undefined;
    let active = true;
    let objectUrl = '';

    setLoading(true);
    setError('');
    setPhotoWarning('');
    setPdfUrl('');

    buildNooPdfPreview(data)
      .then(({ blob, filename, photoWarning: warning }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
        setPdfFilename(filename);
        setPhotoWarning(warning || '');
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Gagal membuat dokumen PDF.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [data]);

  if (!data) return null;

  const handleDownloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await exportNooPdf(data);
    } catch (err) {
      notifyError(err?.message || 'Gagal mengunduh PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintPdf = async () => {
    try {
      await assertExportAllowed('OUTLET');
      const win = iframeRef.current?.contentWindow;
      if (win) {
        win.focus();
        win.print();
        return;
      }
      if (pdfUrl) window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      if (pdfUrl) {
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      notifyError(err?.message || 'Gagal mencetak dokumen PDF.');
    }
  };

  return (
    <NativeDialog
      open
      title="Dokumen PDF Formulir Registrasi Outlet"
      onClose={onClose}
      className="print-sheet-dialog"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 no-print bg-surface p-2.5 mb-3 rounded-xl border border-border-glass">
        <div className="text-xs text-muted-text px-1">
          <span className="font-semibold text-on-surface">{data.name || 'Outlet NOO'}</span>
          {data.registrationCode ? ` · ${data.registrationCode}` : ''}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-3 py-1.5 bg-primary text-white hover:opacity-95 disabled:opacity-60 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LuDownload className="text-sm" />
            {downloading ? 'Mengunduh...' : 'Unduh PDF'}
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={!pdfUrl || loading}
            className="px-3 py-1.5 bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-50 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LuPrinter className="text-sm" /> Cetak
          </button>
          <ExportFormatMenu
            onExportDocx={() => exportNooDocx(data)}
            onExportExcel={() => exportNooExcel(data)}
            onExportCsv={() => exportNooCsv(data)}
            onExportTxt={() => exportNooTxt(data)}
            onExportPdf={() => exportNooPdf(data)}
          />
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-surface-container text-on-surface rounded-lg text-xs font-bold hover:bg-surface-container-high transition-all flex items-center gap-1 cursor-pointer"
          >
            <LuX className="text-sm" /> Tutup
          </button>
        </div>
      </div>

      {photoWarning && (
        <div className="mb-3 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 text-xs">
          {photoWarning} Pratinjau PDF tetap dibuat tanpa gambar lampiran.
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 bg-surface-container/40 rounded-lg border border-border-glass text-sm text-muted-text">
          <LuLoader className="text-xl animate-spin text-primary" />
          <span>Menyiapkan dokumen PDF A4...</span>
        </div>
      ) : error ? (
        <div className="p-5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 text-sm space-y-2">
          <p className="font-semibold">Gagal menyiapkan pratinjau PDF.</p>
          <p className="text-xs">{error}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <iframe
            ref={iframeRef}
            src={`${pdfUrl}#view=FitH`}
            title={`PDF ${pdfFilename}`}
            className="w-full h-[58dvh] md:h-[74vh] min-h-[340px] md:min-h-[520px] rounded-lg border border-border-glass bg-slate-100"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-text px-1 no-print">
            <span>File: {pdfFilename}</span>
            <a
              href={pdfUrl}
              download={pdfFilename}
              className="font-semibold text-primary hover:underline"
            >
              Unduh langsung jika pratinjau tidak tampil
            </a>
          </div>
        </div>
      )}
    </NativeDialog>
  );
};
