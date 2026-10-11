import { assertExportAllowed, downloadOperationalFile } from '../../../services/operationalExportService';
import { buildDocumentCsv } from './csvBuilder';
import { buildDocumentTxt } from './txtBuilder';
import { sanitizeFilename } from './formatters';

const MIME_TYPES = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv;charset=utf-8;',
  txt: 'text/plain;charset=utf-8;',
  pdf: 'application/pdf',
};

function resolveFilename(baseFilename, customFilename, ext) {
  const raw = customFilename || baseFilename || 'Dokumen_Operasional';
  const cleaned = sanitizeFilename(raw.replace(/\.(docx|xlsx|xls|csv|txt|pdf)$/i, ''));
  return `${cleaned}.${ext}`;
}

export function createDocumentExporters(buildBlueprint) {
  const exportDocx = async (...args) => {
    const blueprint = buildBlueprint(...args);
    await assertExportAllowed(blueprint.domain);
    const {buildDocumentDocx} = await import('./docxBuilder');
    const buffer = await buildDocumentDocx(blueprint);
    const filename = resolveFilename(blueprint.filename, blueprint.customFilename, 'docx');
    await downloadOperationalFile(buffer, filename, MIME_TYPES.docx, blueprint.domain);
    return buffer;
  };

  const exportExcel = async (...args) => {
    const blueprint = buildBlueprint(...args);
    await assertExportAllowed(blueprint.domain);
    const {buildDocumentExcel} = await import('./excelBuilder');
    const buffer = await buildDocumentExcel(blueprint);
    const filename = resolveFilename(blueprint.filename, blueprint.customFilename, 'xlsx');
    await downloadOperationalFile(buffer, filename, MIME_TYPES.xlsx, blueprint.domain);
    return buffer;
  };

  const exportCsv = async (...args) => {
    const blueprint = buildBlueprint(...args);
    await assertExportAllowed(blueprint.domain);
    const content = buildDocumentCsv(blueprint);
    const filename = resolveFilename(blueprint.filename, blueprint.customFilename, 'csv');
    await downloadOperationalFile(content, filename, MIME_TYPES.csv, blueprint.domain);
    return content;
  };

  const exportTxt = async (...args) => {
    const blueprint = buildBlueprint(...args);
    await assertExportAllowed(blueprint.domain);
    const content = buildDocumentTxt(blueprint);
    const filename = resolveFilename(blueprint.filename, blueprint.customFilename, 'txt');
    await downloadOperationalFile(content, filename, MIME_TYPES.txt, blueprint.domain);
    return content;
  };

  const exportPdf = async (...args) => {
    const blueprint = buildBlueprint(...args);
    await assertExportAllowed(blueprint.domain);
    const {buildDocumentPdf} = await import('./pdfBuilder');
    const buffer = await buildDocumentPdf(blueprint);
    const filename = resolveFilename(blueprint.filename, blueprint.customFilename, 'pdf');
    await downloadOperationalFile(buffer, filename, MIME_TYPES.pdf, blueprint.domain);
    return buffer;
  };

  const createBoundExporters = (...args) => ({
    toDocx: () => exportDocx(...args),
    toExcel: () => exportExcel(...args),
    toCsv: () => exportCsv(...args),
    toTxt: () => exportTxt(...args),
    toPdf: () => exportPdf(...args),
  });

  return {
    exportDocx,
    exportExcel,
    exportCsv,
    exportTxt,
    exportPdf,
    createBoundExporters,
  };
}
