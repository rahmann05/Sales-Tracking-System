import { mtdCsv } from '../../../../../shared/report-semantics.mjs';
import { createDocumentExporters } from '../core/createDocumentExporters';
import {
  formatCurrency,
  formatNumber,
  formatReportBasisNotes,
  safeStr,
} from '../core/formatters';

function buildMtdReportBlueprint(input = {}, monthArg, yearArg) {
  const reportData = input?.reportData ? input.reportData : input;
  const p = reportData?.period || {};
  const s = reportData?.summary || {};
  const salesmen = Array.isArray(reportData?.salesmen) ? reportData.salesmen : [];
  const channelBreakdown = Array.isArray(reportData?.channelBreakdown)
    ? reportData.channelBreakdown
    : [];
  const monthLabel = safeStr(p.monthName || input?.month || monthArg, 'Bulan Berjalan');
  const yearLabel = safeStr(p.year || input?.year || yearArg, new Date().getFullYear());

  const targetVal = s.monthlyTargetAmount !== undefined ? s.monthlyTargetAmount : s.monthlyTarget;
  const targetStr = targetVal != null ? formatCurrency(targetVal) : 'Belum ditetapkan';
  const mtdActualStr =
    s.mtdActualAmount === null ? 'Dibatasi aturan' : formatCurrency(s.mtdActualAmount || 0);
  const achStr = safeStr(s.overallAchievementRate || s.achievementRate, '—');
  const lmaStr =
    s.lastMonthActual === null ? 'Dibatasi aturan' : formatCurrency(s.lastMonthActual || 0);
  const lmaRateStr = safeStr(s.mtdToLmaRate, '0%');
  const planCalls = Number(s.totalMtdPlanCalls ?? s.mtdPlanCalls ?? 0);
  const actualCalls = Number(s.totalMtdActualCalls ?? s.mtdActualCalls ?? 0);
  const complianceRate = safeStr(s.mtdCallComplianceRate || s.callComplianceRate, '0%');
  const ecCalls = Number(s.totalMtdEffectiveCalls ?? s.mtdEffectiveCalls ?? 0);
  const ecRate = safeStr(s.mtdEffectiveCallRate || s.effectiveCallRate, '0%');
  const totalSku = Number(s.totalMtdSkuSold ?? s.totalSkuSold ?? 0);

  const sections = [
    {
      title: '1. Rincian Performa Penjualan & Kunjungan per Salesman (MTD)',
      headers: [
        'No',
        'Nama Salesman',
        'Wilayah / Klaster',
        'Target Bulanan (Rp)',
        'Realisasi MTD (Rp)',
        'Ach (%)',
        'Realisasi Bulan Lalu (Rp)',
        'MTD vs LMA',
        'Plan Call',
        'Actual Call',
        'Compliance',
        'Effective Call',
        'EC Rate',
        'Total SKU',
      ],
      rows: salesmen.map((sm, idx) => [
        idx + 1,
        safeStr(sm.salesmanName || sm.name),
        safeStr(sm.clusterName || sm.area, '-'),
        sm.monthlyTarget != null ? formatCurrency(sm.monthlyTarget) : 'Belum ditetapkan',
        sm.mtdActualAmount === null ? 'Dibatasi aturan' : formatCurrency(sm.mtdActualAmount || 0),
        safeStr(sm.achievementRate, '—'),
        sm.lastMonthActual === null ? 'Dibatasi aturan' : formatCurrency(sm.lastMonthActual || 0),
        safeStr(sm.mtdToLmaRate, '0%'),
        formatNumber(sm.mtdPlanCalls || 0),
        formatNumber(sm.mtdActualCalls || 0),
        safeStr(sm.callComplianceRate, '0%'),
        formatNumber(sm.mtdEffectiveCalls || 0),
        safeStr(sm.effectiveCallRate, '0%'),
        formatNumber(sm.totalSkuSold || 0),
      ]),
      rightAlignCols: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    },
  ];

  if (channelBreakdown.length > 0) {
    sections.push({
      title: '2. Rincian Kontribusi Penjualan per Saluran Distribusi (Channel Breakdown)',
      headers: [
        'No',
        'Saluran Distribusi (Channel)',
        'Jumlah Outlet Aktif',
        'Total Kunjungan',
        'Effective Calls (EC)',
        'Nilai Order Disetujui (Rp)',
        'Kontribusi (%)',
      ],
      rows: channelBreakdown.map((ch, idx) => [
        idx + 1,
        safeStr(ch.channelLabel || ch.channelName || ch.channel),
        formatNumber(ch.activeOutlets ?? ch.outletCount ?? 0),
        formatNumber(ch.actualCalls ?? ch.totalCalls ?? 0),
        formatNumber(ch.effectiveCalls ?? 0),
        ch.orderAmount === null
          ? 'Dibatasi aturan'
          : formatCurrency(ch.orderAmount ?? ch.revenue ?? 0),
        safeStr(ch.shareRate || ch.contributionRate, '0%'),
      ]),
      rightAlignCols: [2, 3, 4, 5, 6],
    });
  }

  const basisNotes = formatReportBasisNotes(reportData?.basis);

  return {
    domain: 'REPORTS',
    filename: `Laporan_MTD_${monthLabel}_${yearLabel}`,
    sheetName: 'LAPORAN_MTD',
    orientation: 'landscape',
    companyName: reportData?.meta?.company || 'CV. SINAR ANUGRAH',
    title: 'LAPORAN PENCAPAIAN TARGET PENJUALAN BULANAN (MTD)',
    subtitle: `Evaluasi Target vs Realisasi, Perbandingan Bulan Lalu (LMA) & Kepatuhan Kunjungan — ${monthLabel} ${yearLabel}`,
    docNumber: `MTD-${yearLabel}-${String(p.month || '01').padStart(2, '0')}`,
    metaItems: [
      { label: 'Periode Evaluasi', value: `${monthLabel} ${yearLabel}` },
      {
        label: 'Kalender Hari Kerja',
        value: p.calendarKnown
          ? `${p.workingDaysElapsed || 0} / ${p.totalWorkingDays || 0} Hari (${p.workingDaysRate || '0%'})`
          : 'Kalender belum ditetapkan',
      },
      { label: 'Target Periode Bulanan', value: targetStr },
      { label: 'Nilai Order Disetujui MTD', value: `${mtdActualStr} (${achStr})` },
      { label: 'Realisasi Bulan Lalu (LMA)', value: `${lmaStr} (Rasio: ${lmaRateStr})` },
      {
        label: 'Kepatuhan Kunjungan (Call)',
        value: `${formatNumber(actualCalls)} / ${formatNumber(planCalls)} (${complianceRate})`,
      },
      {
        label: 'Effective Call (EC)',
        value: `${formatNumber(ecCalls)} Outlet (${ecRate})`,
      },
      { label: 'Total Distribusi SKU', value: `${formatNumber(totalSku)} SKU` },
    ],
    sections,
    csvContent: mtdCsv(reportData || {}),
    notes:
      basisNotes.length > 0
        ? basisNotes
        : [
            'Laporan Month-to-Date (MTD) menyajikan pencapaian nilai order disetujui terhadap target bulanan dan bulan lalu (LMA).',
          ],
    signatories: [
      { role: 'Disiapkan Oleh,', name: 'Admin Pelaporan', title: 'Sales Support & Data' },
      { role: 'Diperiksa Oleh,', name: 'Supervisor Penjualan', title: 'Koordinator Lapangan' },
      { role: 'Disetujui Oleh,', name: 'Manajer Operasional', title: 'Pimpinan Distribusi' },
    ],
  };
}

const exporters = createDocumentExporters(buildMtdReportBlueprint);
export const exportMtdDocx = exporters.exportDocx;
export const exportMtdExcel = exporters.exportExcel;
export const exportMtdCsv = exporters.exportCsv;
export const exportMtdTxt = exporters.exportTxt;
export const exportMtdPdf = exporters.exportPdf;
export const exportMtdReport = exporters.createBoundExporters;
