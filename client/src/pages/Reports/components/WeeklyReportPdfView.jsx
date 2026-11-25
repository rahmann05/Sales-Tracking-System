import React, { useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { reportExportAllowed } from '../../../../../shared/report-presentation.mjs';
import { DocumentPdfPreview } from '../../../shared/components/document/DocumentPdfPreview';
import {
  buildWeeklyReportBlueprint,
  exportWeeklyCsv,
  exportWeeklyDocx,
  exportWeeklyExcel,
  exportWeeklyPdf,
  exportWeeklyTxt,
} from '../../../utils/export/reports/weeklyReportExport';

/**
 * WeeklyReportPdfView
 * Pratinjau laporan mingguan (WTD) berupa PDF sebenarnya (blueprint yang sama dengan ekspor
 * Word / PDF / Excel / TXT / CSV).
 */
export const WeeklyReportPdfView = ({ reportData, salesmanName, startDate, onClose }) => {
  const { user, settings } = useApp();
  const canExport = reportExportAllowed(user, settings);
  const blueprint = useMemo(
    () => (reportData ? buildWeeklyReportBlueprint(reportData, startDate, salesmanName) : null),
    [reportData, startDate, salesmanName, user]
  );
  if (!blueprint) return null;

  return (
    <DocumentPdfPreview
      title="Pratinjau Dokumen · Laporan Mingguan"
      info={blueprint.docNumber}
      domain="REPORTS"
      disabled={!canExport}
      blueprint={blueprint}
      onExportDocx={() => exportWeeklyDocx(reportData, startDate, salesmanName)}
      onExportExcel={() => exportWeeklyExcel(reportData, startDate, salesmanName)}
      onExportCsv={() => exportWeeklyCsv(reportData, startDate, salesmanName)}
      onExportTxt={() => exportWeeklyTxt(reportData, startDate, salesmanName)}
      onExportPdf={() => exportWeeklyPdf(reportData, startDate, salesmanName)}
      onClose={onClose}
    />
  );
};
