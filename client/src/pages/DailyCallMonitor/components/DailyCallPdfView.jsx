import React, { useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { reportExportAllowed } from '../../../../../shared/report-presentation.mjs';
import { DocumentPdfPreview } from '../../../shared/components/document/DocumentPdfPreview';
import {
  buildDailyCallBlueprint,
  exportDailyCallCsv,
  exportDailyCallDocx,
  exportDailyCallExcel,
  exportDailyCallPdf,
  exportDailyCallTxt,
} from '../../../utils/export/reports/dailyCallReportExport';

/**
 * DailyCallPdfView
 * Pratinjau Daily Call Report berupa PDF sebenarnya (blueprint yang sama dengan ekspor
 * Word / PDF / Excel / TXT / CSV).
 */
export const DailyCallPdfView = ({ reportData, date, salesmanName, onClose }) => {
  const { user, settings } = useApp();
  const canExport = reportExportAllowed(user, settings);
  const blueprint = useMemo(
    () => (reportData ? buildDailyCallBlueprint(reportData, date, salesmanName) : null),
    [reportData, date, salesmanName, user]
  );
  if (!blueprint) return null;

  return (
    <DocumentPdfPreview
      title="Pratinjau Dokumen · Daily Call Report"
      info={blueprint.docNumber}
      domain="REPORTS"
      disabled={!canExport}
      blueprint={blueprint}
      onExportDocx={() => exportDailyCallDocx(reportData, date, salesmanName)}
      onExportExcel={() => exportDailyCallExcel(reportData, date, salesmanName)}
      onExportCsv={() => exportDailyCallCsv(reportData, date, salesmanName)}
      onExportTxt={() => exportDailyCallTxt(reportData, date, salesmanName)}
      onExportPdf={() => exportDailyCallPdf(reportData, date, salesmanName)}
      onClose={onClose}
    />
  );
};
