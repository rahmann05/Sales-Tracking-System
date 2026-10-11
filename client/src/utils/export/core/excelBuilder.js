import {documentImages, fitImage} from './documentImages';
import * as ExcelJSpkg from 'exceljs';
import { formatDateTimeId, safeStr } from './formatters';

const ExcelJS = ExcelJSpkg.Workbook ? ExcelJSpkg : ExcelJSpkg.default || ExcelJSpkg;

const STYLES = {
  borderThin: {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  },
  headerFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } },
  metaLabelFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } },
  zebraFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } },
};

export async function buildDocumentExcel(blueprint) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = blueprint.companyName || 'CV. SINAR ANUGRAH';
  workbook.created = new Date();

  const sheetName = safeStr(blueprint.sheetName || blueprint.title, 'Sheet1')
    .replace(/[\\/?*[\]:]/g, '')
    .slice(0, 31);
  const sheet = workbook.addWorksheet(sheetName || 'Sheet1', {
    pageSetup: {
      paperSize: 9,
      orientation: blueprint.orientation === 'landscape' ? 'landscape' : 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  if (blueprint.rawSheetOnly && blueprint.sections?.[0]) {
    const firstSection = blueprint.sections[0];
    if (firstSection.headers?.length && !blueprint.omitRawHeaders) {
      const hRow = sheet.addRow(firstSection.headers);
      hRow.height = 22;
      hRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = STYLES.headerFill;
        cell.border = STYLES.borderThin;
      });
    }
    for (const row of firstSection.rows || []) {
      const r = sheet.addRow(row.map((v) => typeof v === 'number' && Number.isFinite(v) ? v : safeStr(v, '')));
      r.height = 19;
      r.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.border = STYLES.borderThin;
      });
    }
    sheet.columns.forEach((col) => {
      col.width = 22;
    });
    return workbook.xlsx.writeBuffer();
  }

  const maxCols = Math.max(
    4,
    ...(blueprint.sections || []).map((s) => (s.headers || []).length)
  );

  const companyRow = sheet.addRow([blueprint.companyName || 'CV. SINAR ANUGRAH']);
  sheet.mergeCells(companyRow.number, 1, companyRow.number, maxCols);
  companyRow.getCell(1).font = {
    name: 'Calibri',
    size: 14,
    bold: true,
    color: { argb: 'FF1E3A8A' },
  };

  const titleRow = sheet.addRow([safeStr(blueprint.title, 'DOKUMEN OPERASIONAL').toUpperCase()]);
  sheet.mergeCells(titleRow.number, 1, titleRow.number, maxCols);
  titleRow.getCell(1).font = {
    name: 'Calibri',
    size: 12,
    bold: true,
    color: { argb: 'FF0F172A' },
  };

  const subText = [
    blueprint.subtitle,
    blueprint.docNumber ? `No: ${blueprint.docNumber}` : '',
    `Dicetak: ${formatDateTimeId(new Date())}`,
  ]
    .filter(Boolean)
    .join('  |  ');
  const subRow = sheet.addRow([subText]);
  sheet.mergeCells(subRow.number, 1, subRow.number, maxCols);
  subRow.getCell(1).font = {
    name: 'Calibri',
    size: 9,
    italic: true,
    color: { argb: 'FF475569' },
  };

  sheet.addRow([]);

  if (blueprint.metaItems?.length) {
    for (let i = 0; i < blueprint.metaItems.length; i += 2) {
      const left = blueprint.metaItems[i];
      const right = blueprint.metaItems[i + 1];
      const rowVals = [
        left ? safeStr(left.label, '') : '',
        left ? safeStr(left.value, '-') : '',
        right ? safeStr(right.label, '') : '',
        right ? safeStr(right.value, '-') : '',
      ];
      const mRow = sheet.addRow(rowVals);
      mRow.height = 18;
      [1, 3].forEach((cIdx) => {
        if (rowVals[cIdx - 1]) {
          const c = mRow.getCell(cIdx);
          c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E293B' } };
          c.fill = STYLES.metaLabelFill;
          c.border = STYLES.borderThin;
        }
      });
      [2, 4].forEach((cIdx) => {
        if (rowVals[cIdx - 2]) {
          const c = mRow.getCell(cIdx);
          c.font = { name: 'Calibri', size: 9, color: { argb: 'FF0F172A' } };
          c.border = STYLES.borderThin;
        }
      });
    }
    sheet.addRow([]);
  }

  for (const section of blueprint.sections || []) {
    if (section.title) {
      const secRow = sheet.addRow([section.title.toUpperCase()]);
      sheet.mergeCells(secRow.number, 1, secRow.number, Math.max(2, (section.headers || []).length));
      secRow.getCell(1).font = {
        name: 'Calibri',
        size: 10,
        bold: true,
        color: { argb: 'FF1E3A8A' },
      };
    }

    const headers = section.headers || [];
    const rightSet = new Set(section.rightAlignCols || []);
    const centerSet = new Set(section.centerAlignCols || []);

    if (headers.length) {
      const hRow = sheet.addRow(headers);
      hRow.height = 24;
      headers.forEach((_, idx) => {
        const cell = hRow.getCell(idx + 1);
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = STYLES.headerFill;
        cell.alignment = {
          vertical: 'middle',
          horizontal: rightSet.has(idx) ? 'right' : 'center',
          wrapText: true,
        };
        cell.border = STYLES.borderThin;
      });
    }

    (section.rows || []).forEach((rowArr, rIdx) => {
      const dataRow = sheet.addRow(rowArr.map((v) => (v === null || v === undefined ? '-' : v)));
      dataRow.height = 19;
      headers.forEach((_, cIdx) => {
        const cell = dataRow.getCell(cIdx + 1);
        cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF0F172A' } };
        if (rIdx % 2 === 1) cell.fill = STYLES.zebraFill;
        cell.border = STYLES.borderThin;
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
    });

    sheet.addRow([]);
  }

  for (const image of await documentImages(blueprint)) {
    sheet.addRow([image.caption || 'Foto outlet']);
    const size = fitImage(image, 500, 300);
    const anchor = sheet.rowCount;
    const id = workbook.addImage({base64: image.dataUrl, extension: image.type === 'jpg' ? 'jpeg' : image.type});
    sheet.addImage(id, {tl: {col: 0, row: anchor}, ext: size});
    for (let n = 0; n < Math.ceil(size.height / 20) + 1; n++) sheet.addRow(['']).height = 15;
  }

  if (blueprint.notes?.length) {
    const noteHeader = sheet.addRow(['Dasar & Catatan Dokumen:']);
    noteHeader.getCell(1).font = { name: 'Calibri', size: 9, bold: true };
    for (const note of blueprint.notes) {
      const nRow = sheet.addRow([`• ${note}`]);
      sheet.mergeCells(nRow.number, 1, nRow.number, maxCols);
      nRow.getCell(1).font = {
        name: 'Calibri',
        size: 8.5,
        italic: true,
        color: { argb: 'FF475569' },
      };
    }
    sheet.addRow([]);
  }

  if (blueprint.signatories?.length) {
    const rolesRow = sheet.addRow(blueprint.signatories.map((s) => safeStr(s.role, '')));
    rolesRow.font = { name: 'Calibri', size: 9, bold: true };
    sheet.addRow([]);
    sheet.addRow([]);
    const namesRow = sheet.addRow(
      blueprint.signatories.map((s) => `(${safeStr(s.name, '....................')})`)
    );
    namesRow.font = { name: 'Calibri', size: 9, bold: true };
  }

  sheet.columns.forEach((column, colIdx) => {
    let maxLen = 10;
    column.eachCell({ includeEmpty: false }, (cell, rowNum) => {
      if (rowNum <= 3) return;
      const len = String(cell.value ?? '').length;
      if (len > maxLen) maxLen = len;
    });
    column.width = Math.min(Math.max(maxLen + 3, colIdx === 0 ? 6 : 12), 42);
  });

  sheet.eachRow(row => {
    let lineCount = 1;
    row.eachCell(cell => {
      const text = String(cell.value ?? '');
      const width = Math.max(8, sheet.getColumn(cell.col).width || 12);
      lineCount = Math.max(lineCount, ...text.split('\n').map(line => Math.ceil(line.length / (width - 2))));
      cell.alignment = {...cell.alignment, wrapText: true, vertical: 'middle'};
    });
    row.height = Math.min(409, Math.max(row.height || 18, lineCount * 14 + 6));
  });
  return workbook.xlsx.writeBuffer();
}
