import { documentImages, fitImage } from './documentImages';
import { loadDocumentLogo, logoSize } from './documentLogo';
import { jsPDF } from 'jspdf';
import autoTablePkg from 'jspdf-autotable';
import { normalizeCompanyName } from './documentIdentity';
import { formatDateTimeId, safeStr } from './formatters';
import { FOOTER_RESERVE, INK, MUTED, drawSignatures, underlinedText } from './pdfParts';
import { drawPaperForm } from './formPdf';

const runAutoTable =
  typeof autoTablePkg === 'function'
    ? autoTablePkg
    : typeof autoTablePkg?.default === 'function'
      ? autoTablePkg.default
      : typeof autoTablePkg?.autoTable === 'function'
        ? autoTablePkg.autoTable
        : (doc, opts) => doc.autoTable?.(opts);

const LINE = [0, 0, 0];
const HEAD_FILL = [217, 217, 217];

function drawLetterhead(doc, blueprint, logo, layout) {
  const { pageWidth, margin } = layout;
  const hasLogo = Boolean(logo);
  const size = logoSize(logo, 14);
  const textX = margin + (hasLogo ? size.width + 3 : 0);
  let y = 14;

  if (hasLogo) {
    doc.addImage(logo.dataUrl, logo.type === 'jpg' ? 'JPEG' : 'PNG', margin, y - 5, size.width, size.height);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text(normalizeCompanyName(blueprint.companyName).toUpperCase(), textX, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(
    blueprint.companySub || 'Distribusi & Operasional Penjualan FMCG',
    textX,
    y + 5
  );

  const right = pageWidth - margin;
  if (blueprint.docNumber) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.text(safeStr(blueprint.docNumber), right, y, { align: 'right' });
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(`Dicetak: ${formatDateTimeId(new Date())}`, right, y + 5, { align: 'right' });

  // Garis ganda: tebal di atas, tipis di bawah (seperti kop surat resmi).
  y += Math.max(size.height - 5, 8) + 2;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.8);
  doc.line(margin, y, right, y);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 1.1, right, y + 1.1);
  return y + 6;
}

function drawTitle(doc, blueprint, layout, startY) {
  const { pageWidth, margin } = layout;
  const centerX = pageWidth / 2;
  let y = startY + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  const titleLines = doc.splitTextToSize(
    safeStr(blueprint.title, 'DOKUMEN OPERASIONAL').toUpperCase(),
    pageWidth - margin * 2
  );
  underlinedText(doc, titleLines, centerX, y, 5);
  y += titleLines.length * 5;

  if (blueprint.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    const subtitleLines = doc.splitTextToSize(blueprint.subtitle, pageWidth - margin * 2);
    doc.text(subtitleLines, centerX, y, { align: 'center' });
    y += subtitleLines.length * 3.8;
  }
  return y + 3;
}

function drawMeta(doc, items, layout, startY, compact) {
  const { pageWidth, margin } = layout;
  const body = [];
  for (let i = 0; i < items.length; i += 2) {
    const left = items[i];
    const right = items[i + 1];
    body.push([
      safeStr(left.label, ''),
      ':',
      safeStr(left.value, '-'),
      right ? safeStr(right.label, '') : '',
      right ? ':' : '',
      right ? safeStr(right.value, '-') : '',
    ]);
  }
  const usable = pageWidth - margin * 2;
  const label = usable * 0.17;
  const colon = 3;
  const value = (usable - (label + colon) * 2) / 2;
  runAutoTable(doc, {
    startY,
    body,
    theme: 'plain',
    margin: { left: margin, right: margin, bottom: FOOTER_RESERVE },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: { top: 0.6, bottom: 0.6, left: 0, right: 1 },
      textColor: INK,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: label },
      1: { cellWidth: colon, halign: 'center' },
      2: { cellWidth: value, fontStyle: 'bold' },
      3: { cellWidth: label },
      4: { cellWidth: colon, halign: 'center' },
      5: { cellWidth: value, fontStyle: 'bold' },
    },
  });
  return (doc.lastAutoTable?.finalY || startY) + (compact ? 4 : 5);
}

function sectionColumnStyles(section, usableWidth) {
  const headers = section.headers || [];
  const styles = { 0: { halign: 'center' } };
  const weights = section.columnWidths;
  if (weights?.length === headers.length) {
    const total = weights.reduce((sum, n) => sum + n, 0);
    weights.forEach((weight, i) => {
      styles[i] = { ...styles[i], cellWidth: (usableWidth * weight) / total };
    });
  }
  for (const i of section.rightAlignCols || []) styles[i] = { ...(styles[i] || {}), halign: 'right' };
  for (const i of section.centerAlignCols || [])
    styles[i] = { ...(styles[i] || {}), halign: 'center' };
  return styles;
}

function drawSection(doc, section, layout, startY, compact) {
  const { pageWidth, pageHeight, margin } = layout;
  let y = startY;
  if (section.title) {
    if (y + 14 > pageHeight - FOOTER_RESERVE) {
      doc.addPage();
      y = 14;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(section.title.toUpperCase(), margin, y);
    y += 2;
  }
  const headers = section.headers || [];
  const dense = headers.length > 12 || compact;
  runAutoTable(doc, {
    startY: y,
    head: headers.length ? [headers] : [],
    body: (section.rows || []).map((row) => row.map((v) => safeStr(v, '-'))),
    theme: 'grid',
    margin: { left: margin, right: margin, top: 14, bottom: FOOTER_RESERVE },
    rowPageBreak: 'avoid',
    styles: {
      font: 'helvetica',
      fontSize: headers.length > 12 ? 6.5 : 7.5,
      cellPadding: dense ? 1.2 : 1.8,
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: HEAD_FILL,
      textColor: INK,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: sectionColumnStyles(section, pageWidth - margin * 2),
  });
  return (doc.lastAutoTable?.finalY || y) + (compact ? 3 : 4);
}

function drawNotes(doc, notes, layout, startY) {
  const { pageWidth, pageHeight, margin } = layout;
  let y = startY;
  if (y + 16 > pageHeight - FOOTER_RESERVE) {
    doc.addPage();
    y = 14;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text('Dasar & Catatan Dokumen:', margin, y);
  y += 3.8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...INK);
  notes.forEach((note, index) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${note}`, pageWidth - margin * 2 - 4);
    lines.forEach((line, lineIndex) => {
      if (y + 4 > pageHeight - FOOTER_RESERVE) {
        doc.addPage();
        y = 14;
      }
      doc.text(line, margin + (lineIndex === 0 ? 0 : 4), y);
      y += 3.3;
    });
  });
  return y + 2;
}

function drawImages(doc, images, layout, startY) {
  const { pageWidth, pageHeight, margin } = layout;
  let y = startY;
  for (const image of images) {
    const size = fitImage(image, pageWidth - margin * 2, 85);
    if (y + size.height + 12 > pageHeight - FOOTER_RESERVE) {
      doc.addPage();
      y = 14;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(image.caption || 'Lampiran foto', margin, y);
    y += 4;
    doc.addImage(image.dataUrl, image.type === 'jpg' ? 'JPEG' : 'PNG', margin, y, size.width, size.height);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.15);
    doc.rect(margin, y, size.width, size.height);
    y += size.height + 5;
  }
  return y;
}

function drawPageFooters(doc, blueprint, layout) {
  const { pageWidth, pageHeight, margin } = layout;
  const total = doc.internal.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.setDrawColor(102, 102, 102);
    doc.setLineWidth(0.15);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      `${normalizeCompanyName(blueprint.companyName)} — Sistem Distribusi & Operasional`,
      margin,
      pageHeight - 7
    );
    doc.text(`Halaman ${page} dari ${total}`, pageWidth - margin, pageHeight - 7, {
      align: 'right',
    });
  }
}

export async function buildDocumentPdf(blueprint) {
  const orientation = blueprint.orientation === 'landscape' ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title: safeStr(blueprint.title, 'Dokumen Operasional'),
    author: normalizeCompanyName(blueprint.companyName),
  });
  const layout = {
    pageWidth: doc.internal.pageSize.getWidth(),
    pageHeight: doc.internal.pageSize.getHeight(),
    margin: orientation === 'landscape' ? 12 : 15,
  };
  const compact = blueprint.compact === true;

  const logo = await loadDocumentLogo();

  // Dokumen berbentuk formulir kertas (mis. Form Registrasi Outlet): satu halaman formulir,
  // lalu lampiran foto pada halaman berikutnya bila ada.
  if (blueprint.form) {
    drawPaperForm(doc, blueprint, logo, { ...layout, margin: 12 });
    const attachments = await documentImages(blueprint);
    if (attachments.length) {
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...INK);
      doc.text('LAMPIRAN', layout.margin, 16);
      drawImages(doc, attachments, layout, 22);
    }
    drawPageFooters(doc, blueprint, { ...layout, margin: 12 });
    return doc.output('arraybuffer');
  }

  let y = drawLetterhead(doc, blueprint, logo, layout);
  y = drawTitle(doc, blueprint, layout, y);
  if (blueprint.metaItems?.length) y = drawMeta(doc, blueprint.metaItems, layout, y, compact);
  for (const section of blueprint.paperSections || blueprint.sections || [])
    y = drawSection(doc, section, layout, y, compact);
  y = drawImages(doc, await documentImages(blueprint), layout, y);
  if (blueprint.notes?.length) y = drawNotes(doc, blueprint.notes, layout, y);
  if (blueprint.signatories?.length) drawSignatures(doc, blueprint.signatories, layout, y);
  drawPageFooters(doc, blueprint, layout);

  return doc.output('arraybuffer');
}
