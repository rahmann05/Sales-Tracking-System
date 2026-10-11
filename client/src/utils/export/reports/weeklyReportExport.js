import { weeklyCsv } from '../../../../../shared/report-semantics.mjs';
import { createDocumentExporters } from '../core/createDocumentExporters';
import {
  formatCurrency,
  formatDateId,
  formatNumber,
  formatReportBasisNotes,
  safeStr,
} from '../core/formatters';

function resolveWeeklySalesmanRow(s, idx) {
  const wt = s.weeklyTotal || {};
  const plan = Number(wt.plan ?? s.planCalls ?? s.totalPlanCalls ?? 0);
  const actual = Number(wt.actual ?? s.actualCalls ?? s.totalActualCalls ?? 0);
  const callRate = safeStr(wt.callRate ?? s.complianceRate ?? s.callComplianceRate, '0%');
  const ec = Number(wt.ec ?? s.effectiveCalls ?? s.totalEffectiveCalls ?? 0);
  const ecRate = safeStr(wt.ecRate ?? s.ecRate ?? s.effectiveCallRate, '0%');
  const omzetRaw = wt.omzet !== undefined ? wt.omzet : s.orderAmount ?? s.totalOrderAmount ?? 0;
  const omzetStr = omzetRaw === null ? 'Dibatasi aturan' : formatCurrency(omzetRaw);
  const targetStr =
    wt.target != null
      ? formatCurrency(wt.target)
      : s.weeklyTarget != null
        ? formatCurrency(s.weeklyTarget)
        : 'Belum ditetapkan';
  const achStr = safeStr(wt.targetAchievement ?? s.targetAchievement, '—');

  return [
    idx + 1,
    safeStr(s.salesmanName || s.name),
    safeStr(s.clusterName || s.area, '-'),
    formatNumber(plan),
    formatNumber(actual),
    callRate,
    formatNumber(ec),
    ecRate,
    omzetStr,
    targetStr,
    achStr,
  ];
}

function buildWeeklyReportBlueprint(input = {}, startDateArg, salesmanNameArg) {
  const reportData = input?.reportData ? input.reportData : input;
  const startDate = input?.startDate || startDateArg || reportData?.period?.startDate || '';
  const salesmanName = input?.salesmanName || salesmanNameArg || 'Semua Salesman';
  const p = reportData?.period || {};
  const s = reportData?.summary || {};
  const salesmen = Array.isArray(reportData?.salesmen) ? reportData.salesmen : [];
  const daysSummary = Array.isArray(reportData?.daysSummary) ? reportData.daysSummary : [];
  const dateCode = safeStr(startDate || p.startDate, new Date().toISOString().split('T')[0]);

  const totalPlan = Number(s.totalPlanCalls ?? s.totalPlan ?? 0);
  const totalActual = Number(s.totalActualCalls ?? s.totalActual ?? 0);
  const complianceRate = safeStr(s.callComplianceRate, '0%');
  const totalEc = Number(s.totalEffectiveCalls ?? s.totalEc ?? 0);
  const ecRate = safeStr(s.effectiveCallRate ?? s.ecRate, '0%');
  const totalOrderAmount = s.totalOrderAmount;
  const totalSkuSold = Number(s.totalSkuSold ?? 0);

  const sections = [];

  if (daysSummary.length > 0) {
    sections.push({
      title: '1. Ringkasan Kunjungan Harian dalam Periode Mingguan',
      headers: [
        'No',
        'Hari',
        'Tanggal',
        'Plan Calls',
        'Actual Calls',
        'Compliance',
        'Effective Calls (EC)',
        'Nilai Order Disetujui (Rp)',
      ],
      rows: daysSummary.map((d, idx) => [
        idx + 1,
        safeStr(d.dayName),
        safeStr(d.formattedDate || d.dateStr),
        formatNumber(d.planCalls ?? 0),
        formatNumber(d.actualCalls ?? 0),
        safeStr(d.complianceRate, d.planCalls ? `${Math.round((d.actualCalls / d.planCalls) * 100)}%` : '—'),
        formatNumber(d.effectiveCalls ?? 0),
        d.orderAmount === null ? 'Dibatasi aturan' : formatCurrency(d.orderAmount ?? 0),
      ]),
      rightAlignCols: [3, 4, 5, 6, 7],
    });
  }

  sections.push({
    title:
      daysSummary.length > 0
        ? '2. Matriks Performa Mingguan per Salesman (WTD)'
        : 'Matriks Performa Mingguan per Salesman (WTD)',
    headers: [
      'No',
      'Nama Salesman',
      'Wilayah / Klaster',
      'Total Plan',
      'Total Actual',
      'Compliance (%)',
      'Total EC',
      'EC Rate (%)',
      'Nilai Order Disetujui (Rp)',
      'Target Mingguan (Rp)',
      'Pencapaian Target',
    ],
    rows: salesmen.map(resolveWeeklySalesmanRow),
    rightAlignCols: [3, 4, 5, 6, 7, 8, 9, 10],
  });

  const basisNotes = formatReportBasisNotes(reportData?.basis);

  return {
    domain: 'REPORTS',
    filename: `Laporan_Mingguan_WTD_${dateCode}`,
    sheetName: 'LAPORAN_MINGGUAN',
    orientation: 'landscape',
    companyName: reportData?.meta?.company || 'CV. SINAR ANUGRAH',
    title: 'LAPORAN ANALISIS PERFORMA PENJUALAN MINGGUAN (WTD)',
    subtitle: `Periode Kerja: ${formatDateId(p.startDate || dateCode)} s/d ${formatDateId(p.endDate || dateCode)}`,
    docNumber: `WTD-${dateCode.replace(/-/g, '')}`,
    metaItems: [
      {
        label: 'Rentang Tanggal',
        value: `${formatDateId(p.startDate || dateCode)} - ${formatDateId(p.endDate || dateCode)}`,
      },
      { label: 'Filter Salesman', value: safeStr(salesmanName, 'Semua Salesman') },
      { label: 'Total Plan Calls', value: `${formatNumber(totalPlan)} Kunjungan` },
      {
        label: 'Total Actual Calls',
        value: `${formatNumber(totalActual)} Kunjungan (${complianceRate})`,
      },
      { label: 'Total Effective Calls', value: `${formatNumber(totalEc)} EC (${ecRate})` },
      {
        label: 'Total Nilai Order Disetujui',
        value: totalOrderAmount === null ? 'Dibatasi aturan' : formatCurrency(totalOrderAmount || 0),
      },
      { label: 'Total SKU Terjual', value: `${formatNumber(totalSkuSold)} SKU` },
      { label: 'Jumlah Personel Sales', value: `${formatNumber(salesmen.length)} Salesman` },
    ],
    sections,
    csvContent: weeklyCsv(reportData || {}),
    notes:
      basisNotes.length > 0
        ? basisNotes
        : [
            'Laporan mingguan (WTD) menyajikan kepatuhan rute kunjungan (PJP), pencapaian Effective Call (EC), dan nilai order disetujui.',
          ],
    signatories: [
      { role: 'Dibuat Oleh,', name: 'Admin Pelaporan', title: 'Sales Support' },
      { role: 'Diperiksa Oleh,', name: 'Supervisor Area', title: 'Koordinator Tim' },
      { role: 'Disetujui Oleh,', name: 'Manajer Penjualan', title: 'Pimpinan Distribusi' },
    ],
  };
}

const exporters = createDocumentExporters(buildWeeklyReportBlueprint);
export const exportWeeklyDocx = exporters.exportDocx;
export const exportWeeklyExcel = exporters.exportExcel;
export const exportWeeklyCsv = exporters.exportCsv;
export const exportWeeklyTxt = exporters.exportTxt;
export const exportWeeklyPdf = exporters.exportPdf;
export const exportWeeklyReport = exporters.createBoundExporters;
