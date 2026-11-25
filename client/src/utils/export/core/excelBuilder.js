import { documentImages, fitImage } from './documentImages';
import * as ExcelJSpkg from 'exceljs';
import { normalizeCompanyName } from './documentIdentity';
import { formatDateTimeId, safeStr } from './formatters';

const ExcelJS = ExcelJSpkg.Workbook ? ExcelJSpkg : ExcelJSpkg.default || ExcelJSpkg;

const FONT = 'Arial';
const INK = { argb: 'FF000000' };
const MUTED = { argb: 'FF444444' };
const LINE = { style: 'thin', color: INK };

const STYLES = {
  border: { top: LINE, left: LINE, bottom: LINE, right: LINE },
  headerFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } },
};

const font = (opts = {}) => ({ name: FONT, size: 10, color: INK, ...opts });

function styleHeaderCell(cell, align = 'center') {
  cell.font = font({ bold: true });
  cell.fill = STYLES.headerFill;
  cell.border = STYLES.border;
  cell.alignment = { vertical: 'middle', horizontal: align, wrapText: true };
}

/** Satu baris merge penuh (judul, subjudul, catatan). */
function addMergedRow(sheet, text, maxCols, cellStyle) {
  const row = sheet.addRow([text]);
  sheet.mergeCells(row.number, 1, row.number, maxCols);
  Object.assign(row.getCell(1), cellStyle);
  return row;
}

function addLetterhead(sheet, blueprint, maxCols) {
  const company = addMergedRow(
    sheet,
    normalizeCompanyName(blueprint.companyName).toUpperCase(),
    maxCols,
    { font: font({ size: 14, bold: true }), alignment: { horizontal: 'left' } }
  );
  company.height = 22;
  // Tidak di-merge: teks meluap ke sel kosong di sebelahnya, sedangkan garis ganda kop
  // dipasang pada setiap kolom tabel.
  const tagline = sheet.addRow([blueprint.companySub || 'Distribusi & Operasional Penjualan FMCG']);
  tagline.getCell(1).font = font({ size: 9, color: MUTED });
  for (let col = 1; col <= maxCols; col++) {
    tagline.getCell(col).border = { bottom: { style: 'double', color: INK } };
  }
  sheet.addRow([]);

  addMergedRow(sheet, safeStr(blueprint.title, 'DOKUMEN OPERASIONAL').toUpperCase(), maxCols, {
    font: font({ size: 12, bold: true, underline: true }),
    alignment: { horizontal: 'center', wrapText: true },
  }).height = 20;
  if (blueprint.subtitle) {
    addMergedRow(sheet, blueprint.subtitle, maxCols, {
      font: font({ size: 9 }),
      alignment: { horizontal: 'center', wrapText: true },
    });
  }
  const refLine = [
    blueprint.docNumber ? `Nomor: ${blueprint.docNumber}` : '',
    `Dicetak: ${formatDateTimeId(new Date())}`,
  ]
    .filter(Boolean)
    .join('   |   ');
  addMergedRow(sheet, refLine, maxCols, {
    font: font({ size: 8, color: MUTED }),
    alignment: { horizontal: 'center' },
  });
  sheet.addRow([]);
}

/** Keterangan gaya surat: "Label : nilai" satu per baris, tanpa kotak. */
function addMeta(sheet, items, maxCols) {
  for (const item of items) {
    const row = sheet.addRow([safeStr(item.label, ''), '', `: ${safeStr(item.value, '-')}`]);
    sheet.mergeCells(row.number, 1, row.number, 2);
    sheet.mergeCells(row.number, 3, row.number, maxCols);
    row.getCell(1).font = font({ size: 9 });
    row.getCell(3).font = font({ size: 9, bold: true });
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    row.getCell(1).alignment = { vertical: 'top' };
  }
  sheet.addRow([]);
}

function addSectionTable(sheet, section, tableRows) {
  const headers = section.headers || [];
  const rightSet = new Set(section.rightAlignCols || []);
  const centerSet = new Set(section.centerAlignCols || []);

  if (section.title) {
    const titleRow = addMergedRow(
      sheet,
      section.title.toUpperCase(),
      Math.max(2, headers.length),
      { font: font({ size: 9.5, bold: true }), alignment: { horizontal: 'left' } }
    );
    titleRow.height = 18;
  }
  if (headers.length) {
    const headRow = sheet.addRow(headers);
    headRow.height = 24;
    tableRows.add(headRow.number);
    headers.forEach((_, idx) => styleHeaderCell(headRow.getCell(idx + 1)));
  }
  for (const rowArr of section.rows || []) {
    const dataRow = sheet.addRow(rowArr.map((v) => (v === null || v === undefined ? '-' : v)));
    tableRows.add(dataRow.number);
    headers.forEach((_, cIdx) => {
      const cell = dataRow.getCell(cIdx + 1);
      cell.font = font({ size: 9.5 });
      cell.border = STYLES.border;
      cell.alignment = {
        vertical: 'middle',
        horizontal: rightSet.has(cIdx)
          ? 'right'
          : centerSet.has(cIdx) || cIdx === 0
            ? 'center'
            : 'left',
        wrapText: true,
      };
    });
  }
  sheet.addRow([]);
}

function addNotes(sheet, notes, maxCols) {
  addMergedRow(sheet, 'Dasar & Catatan Dokumen:', maxCols, {
    font: font({ size: 9, bold: true }),
    alignment: { horizontal: 'left' },
  });
  notes.forEach((note, index) => {
    addMergedRow(sheet, `${index + 1}. ${note}`, maxCols, {
      font: font({ size: 8.5 }),
      alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
    });
  });
  sheet.addRow([]);
}

async function addImages(workbook, sheet, blueprint) {
  for (const image of await documentImages(blueprint)) {
    sheet.addRow([image.caption || 'Lampiran foto']).getCell(1).font = font({ bold: true });
    const size = fitImage(image, 500, 300);
    const anchor = sheet.rowCount;
    const id = workbook.addImage({
      base64: image.dataUrl,
      extension: image.type === 'jpg' ? 'jpeg' : image.type,
    });
    sheet.addImage(id, { tl: { col: 0, row: anchor }, ext: size });
    for (let n = 0; n < Math.ceil(size.height / 20) + 1; n++) sheet.addRow(['']).height = 15;
  }
}

function fitColumns(sheet, tableRows) {
  sheet.columns.forEach((column, colIdx) => {
    let maxLen = 10;
    column.eachCell({ includeEmpty: false }, (cell, rowNum) => {
      if (!tableRows.has(rowNum)) return;
      const len = String(cell.value ?? '').length;
      if (len > maxLen) maxLen = len;
    });
    column.width = Math.min(Math.max(maxLen + 3, colIdx === 0 ? 6 : 12), 42);
  });
  sheet.eachRow((row) => {
    let lines = 1;
    row.eachCell((cell) => {
      if (cell.isMerged && cell.address !== cell.master?.address) return;
      const text = String(cell.value ?? '');
      const span = cell.isMerged ? 4 : 1;
      const width = Math.max(8, (sheet.getColumn(cell.col).width || 12) * span);
      lines = Math.max(
        lines,
        ...text.split('\n').map((line) => Math.ceil(line.length / (width - 2)))
      );
    });
    row.height = Math.min(409, Math.max(row.height || 16, lines * 13 + 5));
  });
}

export async function buildDocumentExcel(blueprint) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = normalizeCompanyName(blueprint.companyName);
  workbook.title = blueprint.title || 'Dokumen Operasional';
  workbook.created = new Date();

  const sheetName = safeStr(blueprint.sheetName || blueprint.title, 'Sheet1')
    .replace(/[\\/?*[\]:]/g, '')
    .slice(0, 31);
  const company = normalizeCompanyName(blueprint.companyName);
  const sheet = workbook.addWorksheet(sheetName || 'Sheet1', {
    pageSetup: {
      paperSize: 9,
      orientation: blueprint.orientation === 'landscape' ? 'landscape' : 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.7, header: 0.3, footer: 0.3 },
    },
    headerFooter: { oddFooter: `&L&8${company}&R&8Halaman &P dari &N` },
  });

  if (blueprint.rawSheetOnly && blueprint.sections?.[0]) {
    const firstSection = blueprint.sections[0];
    if (firstSection.headers?.length && !blueprint.omitRawHeaders) {
      const headRow = sheet.addRow(firstSection.headers);
      headRow.height = 22;
      headRow.eachCell((cell) => styleHeaderCell(cell));
    }
    for (const row of firstSection.rows || []) {
      const dataRow = sheet.addRow(
        row.map((v) => (typeof v === 'number' && Number.isFinite(v) ? v : safeStr(v, '')))
      );
      dataRow.height = 19;
      dataRow.eachCell((cell) => {
        cell.font = font({ size: 9.5 });
        cell.border = STYLES.border;
      });
    }
    sheet.columns.forEach((col) => {
      col.width = 22;
    });
    return workbook.xlsx.writeBuffer();
  }

  const maxCols = Math.max(4, ...(blueprint.sections || []).map((s) => (s.headers || []).length));
  const tableRows = new Set();

  addLetterhead(sheet, blueprint, maxCols);
  if (blueprint.metaItems?.length) addMeta(sheet, blueprint.metaItems, maxCols);
  for (const section of blueprint.sections || []) addSectionTable(sheet, section, tableRows);
  await addImages(workbook, sheet, blueprint);
  if (blueprint.notes?.length) addNotes(sheet, blueprint.notes, maxCols);

  fitColumns(sheet, tableRows);
  return workbook.xlsx.writeBuffer();
}
