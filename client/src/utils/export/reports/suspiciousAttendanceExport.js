import {
  attendanceAuditCsv,
  distanceStatus,
  durationStatus,
} from '../../../../../shared/report-semantics.mjs';
import { createDocumentExporters } from '../core/createDocumentExporters';
import { formatCurrency, formatDateId, formatNumber, safeStr } from '../core/formatters';

function buildSuspiciousAttendanceBlueprint(input = {}, dateArg) {
  const rows = Array.isArray(input) ? input : Array.isArray(input?.rows) ? input.rows : [];
  const dateStr = safeStr(
    input?.date || dateArg,
    new Date().toISOString().split('T')[0]
  );

  const durationCount = rows.filter((r) => Boolean(r.isDurationAnomaly)).length;
  const distanceCount = rows.filter(
    (r) => Boolean(r.isDistanceAnomaly) || r.distanceWarning === 'WARNING'
  ).length;
  const travelCount = rows.filter((r) => Boolean(r.isTravelAnomaly)).length;
  const skippedCount = rows.filter((r) => Boolean(r.isSkipped)).length;

  const tableRows = rows.map((r, idx) => [
    idx + 1,
    safeStr(r.date, dateStr),
    safeStr(r.salesmanName),
    safeStr(r.clusterName, '-'),
    safeStr(r.customerId || r.customerCode, '-'),
    safeStr(r.customerName || r.outletName),
    safeStr(r.timeIn),
    safeStr(r.timeOut),
    r.durationMinutes != null ? formatNumber(r.durationMinutes, 1) : '-',
    durationStatus(r),
    r.deviationMeters != null ? `${formatNumber(r.deviationMeters)} m` : '-',
    distanceStatus(r),
    r.isTravelAnomaly
      ? `Terdeteksi (${safeStr(r.travelDistanceKm, '0')} km / ${safeStr(r.travelDurationMinutes, '0')} mnt)`
      : 'Normal',
    safeStr(r.travelAnomalyReason || r.earlyReason || r.reason || r.remark, 'Perlu verifikasi'),
    safeStr(r.effectiveCall, 'N'),
    r.orderAmount === null ? 'Dibatasi aturan' : formatCurrency(r.orderAmount || 0),
  ]);

  return {
    domain: 'REPORTS',
    filename: `Audit_Absensi_Janggal_${dateStr}`,
    sheetName: 'AUDIT_ABSENSI',
    orientation: 'landscape',
    title: 'LAPORAN AUDIT ABSENSI JANGGAL & ANOMALI KUNJUNGAN LAPANGAN',
    subtitle: `Evaluasi Durasi Kunjungan, Radius Geofence GPS, Jeda Perjalanan & Rute Terlewat (${formatDateId(dateStr)})`,
    docNumber: `AUD-${dateStr.replace(/-/g, '')}`,
    metaItems: [
      { label: 'Tanggal Evaluasi', value: formatDateId(dateStr) },
      { label: 'Total Temuan Anomali', value: `${formatNumber(rows.length)} Kunjungan` },
      { label: 'Di Bawah Batas Durasi', value: `${formatNumber(durationCount)} Temuan` },
      { label: 'Di Luar Radius GPS', value: `${formatNumber(distanceCount)} Temuan` },
      { label: 'Anomali Jeda Perjalanan', value: `${formatNumber(travelCount)} Temuan` },
      { label: 'Jadwal PJP Terlewat', value: `${formatNumber(skippedCount)} Temuan` },
    ],
    sections: [
      {
        title: 'Daftar Temuan Audit Absensi & Indikasi Anomali Lapangan',
        headers: [
          'No',
          'Tanggal',
          'Salesman',
          'Klaster',
          'Kode Toko',
          'Nama Toko',
          'Jam Masuk',
          'Jam Keluar',
          'Durasi (Mnt)',
          'Status Durasi',
          'Deviasi GPS',
          'Status Jarak',
          'Jeda Perjalanan',
          'Alasan / Keterangan',
          'EC',
          'Nilai Order (Rp)',
        ],
        rows: tableRows,
        rightAlignCols: [8, 10, 15],
        centerAlignCols: [1, 6, 7, 14],
      },
    ],
    csvContent: attendanceAuditCsv(rows),
    notes: [
      'Indikasi anomali membantu pemeriksaan bukti kunjungan (durasi, titik geofence, dan jeda perjalanan); bukan kesimpulan pelanggaran otomatis.',
    ],
    signatories: [
      { role: 'Dievaluasi Oleh,', name: 'Supervisor Area', title: 'Atasan Langsung' },
      { role: 'Diperiksa Oleh,', name: 'Admin Operasional', title: 'Pengendalian Internal' },
      { role: 'Mengetahui,', name: 'Manajer Operasional', title: 'Pimpinan Distribusi' },
    ],
  };
}

const exporters = createDocumentExporters(buildSuspiciousAttendanceBlueprint);
export const exportSuspiciousDocx = exporters.exportDocx;
export const exportSuspiciousExcel = exporters.exportExcel;
export const exportSuspiciousCsv = exporters.exportCsv;
export const exportSuspiciousTxt = exporters.exportTxt;
export const exportSuspiciousPdf = exporters.exportPdf;
export const exportSuspiciousAttendance = exporters.createBoundExporters;
