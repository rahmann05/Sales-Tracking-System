import React, { useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { reportExportAllowed } from '../../../../../shared/report-presentation.mjs';
import { DocumentPdfPreview } from '../../../shared/components/document/DocumentPdfPreview';
import {
  buildMtdReportBlueprint,
  exportMtdCsv,
  exportMtdDocx,
  exportMtdExcel,
  exportMtdPdf,
  exportMtdTxt,
} from '../../../utils/export/reports/mtdReportExport';

/**
 * MtdReportPdfView
 * Pratinjau laporan Month-to-Date (MTD) berupa PDF sebenarnya (blueprint yang sama dengan
 * ekspor Word / PDF / Excel / TXT / CSV).
 */
export const MtdReportPdfView = ({ reportData, salesmanName, year, month, onClose }) => {
  const { user, settings } = useApp();
  const canExport = reportExportAllowed(user, settings);
  const blueprint = useMemo(
    () => (reportData ? buildMtdReportBlueprint(reportData, month, year, salesmanName) : null),
    [reportData, month, year, salesmanName, user]
  );
  if (!blueprint) return null;

  return (
    <DocumentPdfPreview
      title="Pratinjau Dokumen · Laporan MTD"
      info={blueprint.docNumber}
      domain="REPORTS"
      disabled={!canExport}
      blueprint={blueprint}
      onExportDocx={() => exportMtdDocx(reportData, month, year, salesmanName)}
      onExportExcel={() => exportMtdExcel(reportData, month, year, salesmanName)}
      onExportCsv={() => exportMtdCsv(reportData, month, year, salesmanName)}
      onExportTxt={() => exportMtdTxt(reportData, month, year, salesmanName)}
      onExportPdf={() => exportMtdPdf(reportData, month, year, salesmanName)}
      onClose={onClose}
    />
  );
};
