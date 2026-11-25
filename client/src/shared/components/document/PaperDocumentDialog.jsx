import React from 'react';
import { NativeDialog } from '../common/NativeDialog';
import '../../../styles/pages/OperationalDocument.css';

/**
 * PaperDocumentDialog
 * Jendela penampil dokumen ala Word / PDF viewer: toolbar datar di atas, "meja" abu-abu,
 * lalu lembar kertas A4 sebagai children. Semua yang bertanda `no-print` / toolbar /
 * footer tidak ikut tercetak.
 *
 * - `actions`   : tombol di toolbar (ekspor, cetak, dll.)
 * - `footer`    : bilah aksi di bawah penampil (mis. Setujui / Tolak)
 * - `orientation`: 'portrait' | 'landscape' (mengatur lebar meja dan ukuran halaman cetak)
 * - `bleed`    : isi penuh tanpa lembar (mis. penampil PDF bawaan browser dalam iframe)
 */
export function PaperDocumentDialog({
  title,
  heading,
  info,
  orientation = 'portrait',
  bleed = false,
  actions,
  footer,
  busy = false,
  onClose,
  children,
}) {
  const paper = bleed ? 'PDF' : orientation === 'landscape' ? 'A4 · Lanskap' : 'A4 · Potret';
  return (
    <NativeDialog open title={heading || title} busy={busy} onClose={onClose} className="paper-dialog">
      <div className="paper-toolbar no-print">
        <div className="paper-toolbar-info">
          <strong>{title}</strong>
          <span>{[info, paper].filter(Boolean).join(' · ')}</span>
        </div>
        {actions && <div className="paper-toolbar-actions">{actions}</div>}
      </div>
      <div className="paper-desk" data-bleed={bleed || undefined}>
        <div className="paper-stage" data-orientation={orientation}>
          {children}
        </div>
      </div>
      {footer && <div className="paper-bar no-print">{footer}</div>}
    </NativeDialog>
  );
}
