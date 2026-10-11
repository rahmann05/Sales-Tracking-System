import { jsPDF } from 'jspdf';
import autoTablePkg from 'jspdf-autotable';
import { formatDateTimeId, safeStr } from './formatters';

const runAutoTable =
  typeof autoTablePkg === 'function'
    ? autoTablePkg
    : typeof autoTablePkg?.default === 'function'
      ? autoTablePkg.default
      : typeof autoTablePkg?.autoTable === 'function'
        ? autoTablePkg.autoTable
        : (doc, opts) => doc.autoTable?.(opts);

export function buildDocumentPdf(blueprint) {
  const orientation = blueprint.orientation === 'landscape' ? 'landscape' : 'portrait';
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let cursorY = 13;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138);
  doc.text(blueprint.companyName || 'CV. SINAR ANUGRAH', pageWidth / 2, cursorY, {
    align: 'center',
  });
  cursorY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    blueprint.companySub || 'Distribusi & Operasional Penjualan FMCG',
    pageWidth / 2,
    cursorY,
    { align: 'center' }
  );
  cursorY += 3;

  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.6);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(safeStr(blueprint.title, 'DOKUMEN OPERASIONAL').toUpperCase(), pageWidth / 2, cursorY, {
    align: 'center',
  });
  cursorY += 4;

  if (blueprint.subtitle) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(blueprint.subtitle, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 4;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const infoLine = [
    blueprint.docNumber ? `No. Dokumen: ${blueprint.docNumber}` : '',
    `Dicetak: ${formatDateTimeId(new Date())}`,
  ]
    .filter(Boolean)
    .join('   |   ');
  doc.text(infoLine, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 4.5;

  if (blueprint.metaItems?.length) {
    const metaRows = [];
    for (let i = 0; i < blueprint.metaItems.length; i += 2) {
      const left = blueprint.metaItems[i];
      const right = blueprint.metaItems[i + 1];
      metaRows.push([
        left ? safeStr(left.label, '') : '',
        left ? safeStr(left.value, '-') : '',
        right ? safeStr(right.label, '') : '',
        right ? safeStr(right.value, '-') : '',
      ]);
    }
    runAutoTable(doc, {
      startY: cursorY,
      body: metaRows,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 1.6,
        textColor: [15, 23, 42],
        lineColor: [203, 213, 225],
        lineWidth: 0.15,
      },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [239, 246, 255], cellWidth: 34 },
        2: { fontStyle: 'bold', fillColor: [239, 246, 255], cellWidth: 34 },
      },
    });
    cursorY = (doc.lastAutoTable?.finalY || cursorY) + 4;
  }

  for (const section of blueprint.sections || []) {
    if (section.title) {
      if (cursorY + 14 > pageHeight - 16) {
        doc.addPage();
        cursorY = 14;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 58, 138);
      doc.text(section.title.toUpperCase(), margin, cursorY);
      cursorY += 2;
    }

    const headers = section.headers || [];
    const columnStyles = { 0: { halign: 'center' } };
    for (const cIdx of section.rightAlignCols || []) {
      columnStyles[cIdx] = { ...(columnStyles[cIdx] || {}), halign: 'right' };
    }
    for (const cIdx of section.centerAlignCols || []) {
      columnStyles[cIdx] = { ...(columnStyles[cIdx] || {}), halign: 'center' };
    }

    runAutoTable(doc, {
      startY: cursorY,
      head: headers.length ? [headers] : [],
      body: (section.rows || []).map((row) => row.map((v) => safeStr(v, '-'))),
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: headers.length > 12 ? 6.5 : 7.5,
        cellPadding: headers.length > 12 ? 1.2 : 1.8,
        textColor: [15, 23, 42],
        lineColor: [203, 213, 225],
        lineWidth: 0.15,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles,
    });
    cursorY = (doc.lastAutoTable?.finalY || cursorY) + 4;
  }

  if (blueprint.notes?.length) {
    if (cursorY + 16 > pageHeight - 16) {
      doc.addPage();
      cursorY = 14;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Dasar & Catatan Dokumen:', margin, cursorY);
    cursorY += 3.5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    for (const note of blueprint.notes) {
      const wrapped = doc.splitTextToSize(`• ${note}`, pageWidth - margin * 2);
      doc.text(wrapped, margin, cursorY);
      cursorY += wrapped.length * 3.2;
    }
    cursorY += 2;
  }

  if (blueprint.signatories?.length) {
    if (cursorY + 26 > pageHeight - 16) {
      doc.addPage();
      cursorY = 18;
    }
    const count = blueprint.signatories.length;
    const blockWidth = (pageWidth - margin * 2) / count;
    blueprint.signatories.forEach((sig, idx) => {
      const centerX = margin + blockWidth * idx + blockWidth / 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(safeStr(sig.role, ''), centerX, cursorY + 4, { align: 'center' });
      doc.text(`( ${safeStr(sig.name, '........................')} )`, centerX, cursorY + 20, {
        align: 'center',
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(safeStr(sig.title, ''), centerX, cursorY + 24, { align: 'center' });
    });
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${blueprint.companyName || 'CV. SINAR ANUGRAH'} — Sistem Distribusi & Operasional`,
      margin,
      pageHeight - 6
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - margin, pageHeight - 6, {
      align: 'right',
    });
  }

  return doc.output('arraybuffer');
}
