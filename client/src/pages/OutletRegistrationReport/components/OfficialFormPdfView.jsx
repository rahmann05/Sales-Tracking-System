import React, { useCallback } from 'react';
import { DocumentPdfPreview } from '../../../shared/components/document/DocumentPdfPreview';
import {
  buildNooPdfPreview,
  exportNooCsv,
  exportNooDocx,
  exportNooExcel,
  exportNooPdf,
  exportNooTxt,
} from '../../../utils/export/documents/nooDocumentExport';

/** Pratinjau PDF formulir registrasi outlet (NOO): dokumen PDF yang sama dengan hasil ekspor. */
export const OfficialFormPdfView = ({ data, onClose }) => {
  const loadPdf = useCallback(() => buildNooPdfPreview(data), [data]);
  if (!data) return null;
  return (
    <DocumentPdfPreview
      title="Dokumen PDF Formulir Registrasi Outlet"
      info={[data.name || 'Outlet NOO', data.registrationCode].filter(Boolean).join(' · ')}
      domain="OUTLET"
      loadPdf={loadPdf}
      onExportDocx={() => exportNooDocx(data)}
      onExportExcel={() => exportNooExcel(data)}
      onExportCsv={() => exportNooCsv(data)}
      onExportTxt={() => exportNooTxt(data)}
      onExportPdf={() => exportNooPdf(data)}
      onClose={onClose}
    />
  );
};
