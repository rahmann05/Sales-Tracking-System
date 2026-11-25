import React, { useMemo } from 'react';
import { DocumentPdfPreview } from '../../../shared/components/document/DocumentPdfPreview';
import {
  buildPackingListBlueprint,
  exportPackingListCsv,
  exportPackingListDocx,
  exportPackingListExcel,
  exportPackingListPdf,
  exportPackingListTxt,
} from '../../../utils/export/documents/packingListExport';

/**
 * PackingListPrintModal
 * Pratinjau surat perintah muat / packing list berupa PDF sebenarnya (blueprint yang sama
 * dengan ekspor Word / PDF / Excel / TXT / CSV).
 */
export function PackingListPrintModal({ document: doc, onClose }) {
  const blueprint = useMemo(() => (doc ? buildPackingListBlueprint(doc) : null), [doc]);
  if (!blueprint) return null;

  return (
    <DocumentPdfPreview
      title={`Pratinjau Dokumen · ${doc.code || 'Packing List'}`}
      info={blueprint.docNumber}
      domain="PACKING"
      blueprint={blueprint}
      onExportDocx={() => exportPackingListDocx(doc)}
      onExportExcel={() => exportPackingListExcel(doc)}
      onExportCsv={() => exportPackingListCsv(doc)}
      onExportTxt={() => exportPackingListTxt(doc)}
      onExportPdf={() => exportPackingListPdf(doc)}
      onClose={onClose}
    />
  );
}
