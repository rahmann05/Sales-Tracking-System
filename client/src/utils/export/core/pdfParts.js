import { safeStr } from './formatters';

export const INK = [0, 0, 0];
export const MUTED = [68, 68, 68];
export const FOOTER_RESERVE = 18;

/** Teks bergaris bawah (jsPDF tidak punya atribut underline). */
export function underlinedText(doc, lines, x, y, lineHeight, align = 'center') {
  const list = Array.isArray(lines) ? lines : [lines];
  list.forEach((line, index) => {
    const lineY = y + index * lineHeight;
    doc.text(line, x, lineY, { align });
    const width = doc.getTextWidth(line);
    const startX = align === 'center' ? x - width / 2 : x;
    doc.setLineWidth(0.25);
    doc.line(startX, lineY + 0.8, startX + width, lineY + 0.8);
  });
}

/** Tinggi blok tanda tangan (mm), untuk memeriksa muat di halaman. */
export const SIGNATURE_HEIGHT = 34;

/**
 * Blok tanda tangan: peran, ruang tanda tangan, nama bergaris bawah, jabatan.
 * Satu penandatangan ditempatkan di sisi kanan halaman, seperti surat resmi.
 */
export function drawSignatures(doc, signatories, layout, startY) {
  const { pageWidth, pageHeight, margin } = layout;
  let y = startY + 4;
  if (y + SIGNATURE_HEIGHT > pageHeight - (layout.footerReserve ?? FOOTER_RESERVE) + 1) {
    doc.addPage();
    y = 18;
  }
  const single = signatories.length === 1;
  const blockWidth = single ? 70 : (pageWidth - margin * 2) / signatories.length;
  signatories.forEach((sig, idx) => {
    const centerX = single
      ? pageWidth - margin - blockWidth / 2
      : margin + blockWidth * idx + blockWidth / 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(safeStr(sig.role, ''), centerX, y, { align: 'center' });

    const nameLines = doc.splitTextToSize(
      safeStr(sig.name, '............................'),
      blockWidth - 8
    );
    doc.setFont('helvetica', 'bold');
    const nameY = y + 22;
    underlinedText(doc, nameLines, centerX, nameY, 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(safeStr(sig.title, ''), centerX, nameY + nameLines.length * 4, { align: 'center' });
  });
  return y + SIGNATURE_HEIGHT;
}
