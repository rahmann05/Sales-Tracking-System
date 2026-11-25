import { sanitizeFilename } from './formatters';

/**
 * Membuat PDF pratinjau dari blueprint dokumen dengan builder yang sama persis dengan ekspor PDF,
 * sehingga jendela pratinjau menampilkan bentuk dokumen yang sebenarnya (bukan tiruan HTML).
 */
export async function buildBlueprintPdfPreview(blueprint) {
  const { buildDocumentPdf } = await import('./pdfBuilder');
  const buffer = await buildDocumentPdf(blueprint);
  return {
    blob: new Blob([buffer], { type: 'application/pdf' }),
    filename: `${sanitizeFilename(blueprint.filename || 'Dokumen_Operasional')}.pdf`,
    photoWarning: '',
  };
}
