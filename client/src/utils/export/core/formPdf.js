import { logoSize } from './documentLogo';
import { normalizeCompanyName } from './documentIdentity';
import { layoutColumns, resolveBlock } from './formLayout';
import { INK, SIGNATURE_HEIGHT, drawSignatures } from './pdfParts';

/**
 * Penggambar formulir kertas (mis. FORM REGISTRASI OUTLET) ke jsPDF.
 * Membaca model dari nooFormModel.js: kotak bergaris, pilihan bercentang, dan isian terisi.
 * Skala dipilih otomatis agar seluruh formulir (termasuk tanda tangan) muat satu halaman A4.
 */

const SCALES = [1, 0.96, 0.92, 0.88, 0.84, 0.8, 0.76];
const TOP = 12;
const BOTTOM_LIMIT = 14;
const HEADER_H = 17;
const MIN_MAPPING = 24;
const MAX_MAPPING = 52;

const metricsFor = (s) => ({
  s,
  lh: 4.0 * s,
  fs: 7.6 * s,
  small: 6.5 * s,
  box: 3.1 * s,
  cpad: 1.5 * s,
  bpad: 1.8 * s,
  rowGap: 1.2 * s,
  blockGap: 2.2 * s,
});

function applyFont(doc, m, line) {
  const style = line.bold ? (line.italic ? 'bolditalic' : 'bold') : line.italic ? 'italic' : 'normal';
  doc.setFont('helvetica', style);
  doc.setFontSize(line.small ? m.small : m.fs);
  doc.setTextColor(...INK);
}

const wrap = (doc, m, line, value, width) => {
  applyFont(doc, m, line);
  return doc.splitTextToSize(String(value || ' '), Math.max(width, 6));
};

function measureLine(doc, m, line, w) {
  switch (line.t) {
    case 'gap':
      return line.h * m.s;
    case 'kv':
      return Math.max(1, wrap(doc, m, { bold: true }, line.value, w - line.lw - 3).length) * m.lh;
    case 'box':
      return measureLine(doc, m, { ...line, t: 'kv' }, w - 3 * m.s) + 2.4 * m.s;
    case 'check':
      return Math.max(1, wrap(doc, m, line, line.label, w - m.box - 2).length) * m.lh;
    case 'checks':
      return m.lh;
    default:
      return Math.max(1, wrap(doc, m, line, line.text, w).length) * m.lh;
  }
}

function drawCheckbox(doc, m, x, y, checked) {
  const by = y + (m.lh - m.box) / 2;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.25);
  doc.rect(x, by, m.box, m.box);
  if (checked) {
    doc.setLineWidth(0.5);
    doc.line(x + 0.55, by + m.box * 0.52, x + m.box * 0.42, by + m.box - 0.6);
    doc.line(x + m.box * 0.42, by + m.box - 0.6, x + m.box - 0.45, by + 0.55);
  }
  doc.setLineWidth(0.25);
}

const baseline = (m, y) => y + m.lh * 0.72;

function drawKv(doc, m, line, x, y, w) {
  const base = baseline(m, y);
  applyFont(doc, m, { bold: false });
  doc.text(line.label, x, base);
  doc.text(':', x + line.lw, base);
  const rows = wrap(doc, m, { bold: true }, line.value, w - line.lw - 3);
  applyFont(doc, m, { bold: true });
  rows.forEach((row, i) => doc.text(row, x + line.lw + 2.2, base + i * m.lh));
  return Math.max(1, rows.length) * m.lh;
}

function drawChecks(doc, m, line, x, y, w) {
  const base = baseline(m, y);
  let start = x;
  if (line.label) {
    applyFont(doc, m, { bold: false });
    doc.text(line.label, x, base);
    doc.text(':', x + line.lw, base);
    start = x + line.lw + 2.2;
  }
  const cell = (w - (start - x)) / line.items.length;
  line.items.forEach((item, i) => {
    const cx = start + cell * i;
    applyFont(doc, m, { bold: false });
    doc.text(item.label, cx, base);
    drawCheckbox(doc, m, cx + doc.getTextWidth(item.label) + 1.6, y, item.checked);
  });
  return m.lh;
}

function drawLine(doc, m, line, x, y, w) {
  switch (line.t) {
    case 'gap':
      return line.h * m.s;
    case 'kv':
      return drawKv(doc, m, line, x, y, w);
    case 'box': {
      const h = measureLine(doc, m, line, w);
      doc.setDrawColor(...INK);
      doc.setLineWidth(0.3);
      doc.rect(x, y, w, h);
      drawKv(doc, m, { ...line, t: 'kv' }, x + 1.5 * m.s, y + 1.2 * m.s, w - 3 * m.s);
      return h;
    }
    case 'check': {
      const rows = wrap(doc, m, line, line.label, w - m.box - 2);
      rows.forEach((row, i) => doc.text(row, x, baseline(m, y) + i * m.lh));
      drawCheckbox(doc, m, x + w - m.box, y, line.checked);
      return Math.max(1, rows.length) * m.lh;
    }
    case 'checks':
      return drawChecks(doc, m, line, x, y, w);
    default: {
      const rows = wrap(doc, m, line, line.text, w);
      rows.forEach((row, i) => {
        const base = baseline(m, y) + i * m.lh;
        if (line.align === 'right') doc.text(row, x + w, base, { align: 'right' });
        else doc.text(row, x, base);
      });
      return Math.max(1, rows.length) * m.lh;
    }
  }
}


/** Lebar label (mm) diukur dengan font dokumen pada skala yang sedang dipakai. */
const resolve = (doc, m, block) =>
  resolveBlock(block, (label) => {
    applyFont(doc, m, { bold: false });
    return doc.getTextWidth(label);
  });

function columnHeight(doc, m, col, width) {
  const pad = col.box ? m.cpad : 0;
  const inner = col.lines.reduce((sum, line) => sum + measureLine(doc, m, line, width - pad * 2), 0);
  return inner + pad * 2;
}

function rowHeight(doc, m, row, innerW, minH = 0) {
  const tallest = layoutColumns(row.columns, innerW).reduce(
    (max, p) => Math.max(max, columnHeight(doc, m, p.col, p.width)),
    0
  );
  return Math.max(tallest, (row.minH || minH) * m.s);
}

function blockHeight(doc, m, block, innerW, minRowH) {
  const rows = block.rows.map((row) => rowHeight(doc, m, row, innerW, minRowH));
  return rows.reduce((a, b) => a + b, 0) + m.rowGap * (rows.length - 1) + m.bpad * 2;
}

function drawBlock(doc, m, block, x, y, W, forcedH) {
  const innerW = W - m.bpad * 2;
  const height = forcedH || blockHeight(doc, m, block, innerW);
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.35);
  doc.rect(x, y, W, height);
  let cy = y + m.bpad;
  block.rows.forEach((row, index) => {
    const rh =
      forcedH && index === block.rows.length - 1
        ? height - m.bpad * 2 - (cy - y - m.bpad)
        : rowHeight(doc, m, row, innerW);
    layoutColumns(row.columns, innerW).forEach(({ col, x: cx, width }) => {
      const pad = col.box ? m.cpad : 0;
      if (col.box) {
        doc.setDrawColor(...INK);
        doc.setLineWidth(0.3);
        doc.rect(x + m.bpad + cx, cy, width, rh);
      }
      let ly = cy + pad;
      col.lines.forEach((line) => {
        ly += drawLine(doc, m, line, x + m.bpad + cx + pad, ly, width - pad * 2);
      });
    });
    cy += rh + m.rowGap;
  });
  return height;
}

function drawHeader(doc, m, model, blueprint, logo, layout) {
  const { pageWidth, margin } = layout;
  let textX = margin;
  if (logo) {
    const size = logoSize(logo, 12);
    doc.addImage(logo.dataUrl, logo.type === 'jpg' ? 'JPEG' : 'PNG', margin, TOP, size.width, size.height);
    textX += size.width + 2.5;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...INK);
  doc.text(normalizeCompanyName(blueprint.companyName).toUpperCase(), textX, TOP + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setCharSpace(1.1);
  doc.text('FMCG DISTRIBUTOR', textX, TOP + 9.6);
  doc.setCharSpace(0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(model.title, pageWidth / 2 + 8, TOP + 3, { align: 'center' });

  let y = TOP + HEADER_H;
  model.meta.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5 * m.s);
    doc.text(item.label, margin, y);
    doc.text(':', margin + 22, y);
    doc.text(item.value || '', margin + 25, y);
    y += 4.6 * m.s;
  });
  return y;
}

function metaHeight(m, model) {
  return model.meta.length * 4.6 * m.s;
}

/** Pilih skala terbesar yang membuat seluruh formulir muat satu halaman. */
function planScale(doc, model, layout) {
  const W = layout.pageWidth - layout.margin * 2;
  const avail = layout.pageHeight - TOP - BOTTOM_LIMIT;
  const heightAt = (m) =>
    HEADER_H +
    metaHeight(m, model) +
    1 +
    model.blocks.reduce(
      (sum, b) => sum + blockHeight(doc, m, resolve(doc, m, b), W - m.bpad * 2) + m.blockGap,
      0
    ) +
    4.2 * m.s +
    SIGNATURE_HEIGHT +
    4;
  for (const s of SCALES) {
    const m = metricsFor(s);
    if (heightAt(m) + MIN_MAPPING * s <= avail) return { m, W, avail, used: heightAt(m) };
  }
  const m = metricsFor(SCALES[SCALES.length - 1]);
  return { m, W, avail, used: heightAt(m) };
}

/**
 * Menggambar formulir lengkap pada halaman pertama dan mengembalikan posisi Y berikutnya.
 * Tanda tangan mengikuti aturan dokumen: hanya Supervisor, dicetak pada Word dan PDF.
 */
export function drawPaperForm(doc, blueprint, logo, layout) {
  const model = blueprint.form;
  const { m, W, avail, used } = planScale(doc, model, layout);
  const x = layout.margin;
  let y = drawHeader(doc, m, model, blueprint, logo, layout) + 1;

  for (const block of model.blocks) {
    y += drawBlock(doc, m, resolve(doc, m, block), x, y, W) + m.blockGap;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8 * m.s);
  doc.setTextColor(...INK);
  doc.text(model.footnote, x, y + 2.2 * m.s);
  y += 4.2 * m.s;

  const mappingH = Math.min(MAX_MAPPING, Math.max(MIN_MAPPING * m.s, avail - used));
  y += drawBlock(doc, m, resolve(doc, m, model.mapping), x, y, W, mappingH);

  return drawSignatures(doc, blueprint.signatories || [], { ...layout, footerReserve: BOTTOM_LIMIT }, y);
}
