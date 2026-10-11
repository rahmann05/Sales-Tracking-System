import { dailyCallCsv } from '../../../../../shared/report-semantics.mjs';
import { createDocumentExporters } from '../core/createDocumentExporters';
import {
  formatCurrency,
  formatDateId,
  formatNumber,
  formatReportBasisNotes,
  safeStr,
} from '../core/formatters';

function resolveDailySummary(reportData = {}, dateInput) {
  const s = reportData.summary || {};
  const rows = Array.isArray(reportData.rows) ? reportData.rows : [];
  const salesmanSummaries = Array.isArray(reportData.salesmanSummaries)
    ? reportData.salesmanSummaries
    : [];
  const dateStr = safeStr(dateInput || reportData.date, new Date().toISOString().split('T')[0]);
  return {
    dateStr,
    rows,
    salesmanSummaries,
    totalPlan: Number(s.totalPlanCalls ?? s.totalPlan ?? rows.filter((r) => r.planCall === 'Y').length),
    totalActual: Number(
      s.totalActualCalls ?? s.completedVisits ?? rows.filter((r) => r.actualCall === 'Y').length
    ),
    complianceRate: safeStr(s.callComplianceRate, '0%'),
    totalEffective: Number(
      s.totalEffectiveCalls ?? s.totalEffective ?? rows.filter((r) => r.effectiveCall === 'Y').length
    ),
    ecRate: safeStr(s.effectiveCallRate, '0%'),
    totalOrderAmount: Number(s.totalOrderAmount ?? 0),
    totalSkuSold: Number(s.totalSkuSold ?? 0),
    totalAnomalies: Number(s.totalAnomalies ?? 0),
  };
}

function buildDailyCallBlueprint(input = {}, dateArg) {
  const reportData = input?.reportData ? input.reportData : input;
  const dateInput = input?.date || dateArg;
  const info = resolveDailySummary(reportData, dateInput);

  const sections = [];

  if (info.salesmanSummaries.length > 0) {
    sections.push({
      title: '1. Rekapitulasi Performa Kunjungan Harian per Salesman',
      headers: [
        'No',
        'Salesman',
        'Wilayah / Klaster',
        'Plan Call',
        'Actual Call',
        'Compliance',
        'Effective Call',
        'EC Rate',
        'SKU Terjual',
        'Nilai Order Disetujui (Rp)',
      ],
      rows: info.salesmanSummaries.map((sm, idx) => [
        idx + 1,
        safeStr(sm.salesmanName),
        safeStr(sm.clusterName, '-'),
        formatNumber(sm.planCalls ?? 0),
        formatNumber(sm.actualCalls ?? 0),
        safeStr(sm.callComplianceRate, '0%'),
        formatNumber(sm.effectiveCalls ?? 0),
        safeStr(sm.effectiveCallRate, '0%'),
        formatNumber(sm.skuSold ?? 0),
        formatCurrency(sm.orderAmount ?? 0),
      ]),
      rightAlignCols: [3, 4, 5, 6, 7, 8, 9],
    });
  }

  sections.push({
    title:
      info.salesmanSummaries.length > 0
        ? '2. Rincian Log Kunjungan Harian (Daily Call Log)'
        : 'Rincian Log Kunjungan Harian (Daily Call Log)',
    headers: [
      'No',
      'Salesman',
      'Kode Toko',
      'Nama Toko / Outlet',
      'Sub Channel',
      'Jam Masuk',
      'Jam Keluar',
      'Durasi (Mnt)',
      'Plan',
      'Act',
      'EC',
      'SKU',
      'Nilai Order Disetujui (Rp)',
      'Deviasi GPS',
      'Alasan / Catatan',
    ],
    rows: info.rows.map((r, idx) => [
      r.no ?? idx + 1,
      safeStr(r.salesmanName),
      safeStr(r.customerId || r.customerCode),
      safeStr(r.customerName || r.outletName),
      safeStr(r.subChannel, '-'),
      safeStr(r.timeIn || r.checkInTime),
      safeStr(r.timeOut || r.checkOutTime),
      r.durationMinutes != null ? formatNumber(r.durationMinutes, 1) : '-',
      safeStr(r.planCall, 'Y'),
      safeStr(r.actualCall, r.timeIn && r.timeIn !== '-' ? 'Y' : 'N'),
      safeStr(r.effectiveCall, Number(r.orderAmount) > 0 ? 'Y' : 'N'),
      formatNumber(r.skuSold || 0),
      r.orderAmount === null ? 'Dibatasi aturan' : formatCurrency(r.orderAmount || 0),
      r.deviationMeters != null ? `${formatNumber(r.deviationMeters)} m` : '-',
      safeStr(r.reason || r.earlyReason || r.remark, 'Normal'),
    ]),
    rightAlignCols: [7, 11, 12, 13],
    centerAlignCols: [5, 6, 8, 9, 10],
  });

  const basisNotes = formatReportBasisNotes(reportData?.basis);

  return {
    domain: 'REPORT',
    filename: `Laporan_Kunjungan_Harian_${info.dateStr}`,
    sheetName: 'DAILY_CALL',
    orientation: 'landscape',
    companyName: reportData?.meta?.company || 'CV. SINAR ANUGRAH',
    title: 'LAPORAN KUNJUNGAN HARIAN SALES (DAILY CALL REPORT)',
    subtitle: `Tanggal Operasional: ${formatDateId(info.dateStr)}`,
    docNumber: `DCR-${info.dateStr.replace(/-/g, '')}`,
    metaItems: [
      { label: 'Tanggal Kunjungan', value: formatDateId(info.dateStr) },
      { label: 'Total Rencana (Plan)', value: `${formatNumber(info.totalPlan)} Outlet` },
      {
        label: 'Realisasi (Actual Call)',
        value: `${formatNumber(info.totalActual)} Outlet (${info.complianceRate})`,
      },
      {
        label: 'Effective Call (EC)',
        value: `${formatNumber(info.totalEffective)} Outlet (${info.ecRate})`,
      },
      { label: 'Total SKU Terjual', value: `${formatNumber(info.totalSkuSold)} SKU` },
      { label: 'Total Nilai Order Disetujui', value: formatCurrency(info.totalOrderAmount) },
      { label: 'Indikasi Anomali Presensi', value: `${formatNumber(info.totalAnomalies)} Temuan` },
      { label: 'Total Baris Kunjungan', value: `${formatNumber(info.rows.length)} Kunjungan` },
    ],
    sections,
    csvContent: dailyCallCsv({ ...reportData, rows: info.rows }),
    notes:
      basisNotes.length > 0
        ? basisNotes
        : [
            'Laporan kunjungan harian mencatat kehadiran masuk/keluar, realisasi PJP, dan nilai order disetujui.',
          ],
    signatories: [
      { role: 'Dilaporkan Oleh,', name: 'Koordinator Sales', title: 'Admin Penjualan' },
      { role: 'Diperiksa Oleh,', name: 'Supervisor Area', title: 'Supervisor Lapangan' },
      { role: 'Disetujui Oleh,', name: 'Manajer Penjualan', title: 'Pimpinan Operasional' },
    ],
  };
}

const exporters = createDocumentExporters(buildDailyCallBlueprint);
export const exportDailyCallDocx = exporters.exportDocx;
export const exportDailyCallExcel = exporters.exportExcel;
export const exportDailyCallCsv = exporters.exportCsv;
export const exportDailyCallTxt = exporters.exportTxt;
export const exportDailyCallPdf = exporters.exportPdf;
export const exportDailyCallReport = exporters.createBoundExporters;
