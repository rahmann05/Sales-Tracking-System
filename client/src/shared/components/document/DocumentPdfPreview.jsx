import React from 'react';
import { LuLoader, LuPrinter } from 'react-icons/lu';
import { usePdfPreview } from '../../hooks/usePdfPreview';
import { ExportFormatMenu } from '../common/ExportFormatMenu';
import { PaperDocumentDialog } from './PaperDocumentDialog';

/**
 * DocumentPdfPreview
 * Jendela pratinjau yang menampilkan dokumen PDF sebenarnya (hasil builder PDF yang sama dengan
 * ekspor), lengkap dengan halaman, kop, tabel, dan tanda tangan. "Cetak" mencetak PDF itu sendiri.
 *
 * - `blueprint`  : isi dokumen (sumber yang sama dengan ekspor Word/PDF/Excel/TXT/CSV)
 * - `loadPdf`    : alternatif pembuat PDF khusus (harus stabil / di-memo), mis. dokumen berfoto
 * - `disabled`   : menonaktifkan ekspor dan cetak bila pengguna tidak berhak
 */
export function DocumentPdfPreview({
  title,
  info,
  domain = 'REPORTS',
  disabled = false,
  blueprint,
  loadPdf,
  onExportDocx,
  onExportExcel,
  onExportCsv,
  onExportTxt,
  onExportPdf,
  onClose,
}) {
  const { iframeRef, pdf, loading, error, ready, print } = usePdfPreview({
    blueprint,
    loadPdf,
    domain,
  });

  return (
    <PaperDocumentDialog
      title={title}
      info={info}
      bleed
      onClose={onClose}
      actions={
        <>
          <ExportFormatMenu
            disabled={disabled}
            onExportDocx={onExportDocx}
            onExportExcel={onExportExcel}
            onExportCsv={onExportCsv}
            onExportTxt={onExportTxt}
            onExportPdf={onExportPdf}
          />
          <button type="button" className="paper-btn" onClick={print} disabled={disabled || !ready}>
            <LuPrinter aria-hidden="true" /> Cetak
          </button>
        </>
      }
      footer={
        ready ? (
          <>
            <span className="paper-bar-note">File: {pdf.filename}</span>
            <a className="paper-btn" href={pdf.url} download={pdf.filename}>
              Unduh langsung jika pratinjau tidak tampil
            </a>
          </>
        ) : null
      }
    >
      {pdf.warning && (
        <p className="paper-support" role="status">
          {pdf.warning} Pratinjau PDF tetap dibuat tanpa gambar lampiran.
        </p>
      )}
      {loading ? (
        <div className="paper-support paper-loading" role="status">
          <LuLoader className="animate-spin" aria-hidden="true" />
          <span>Menyiapkan dokumen PDF A4...</span>
        </div>
      ) : error ? (
        <div className="paper-support" role="alert">
          <p>
            <strong>Gagal menyiapkan pratinjau PDF.</strong>
          </p>
          <p>{error}</p>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          src={`${pdf.url}#view=FitH&navpanes=0`}
          title={`Pratinjau ${pdf.filename}`}
          className="paper-pdf-frame"
        />
      )}
    </PaperDocumentDialog>
  );
}
