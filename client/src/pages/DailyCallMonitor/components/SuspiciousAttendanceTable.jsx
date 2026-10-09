import {downloadOperationalFile} from '../../../services/operationalExportService';
import { SuspiciousAttendanceSummary } from './SuspiciousAttendanceSummary';
import { SuspiciousAttendanceRows } from './SuspiciousAttendanceRows';
import React, { useState } from 'react';
import { LuSearch } from "react-icons/lu";

/**
 * SuspiciousAttendanceTable Component
 * Single Responsibility: Dedicated table and audit dashboard for abnormal / suspicious attendances
 * (Early checkout < 5 minutes, GPS deviation > 50 meters, Travel time gaps e.g. 2km in 2 hours, and Skipped visits).
 */
export const SuspiciousAttendanceTable = ({
  rows = [],
  isLoading = false,
  onSelectRow
}) => {
  const [filterAnomalyType, setFilterAnomalyType] = useState('ALL'); // 'ALL' | 'DURATION' | 'DISTANCE' | 'TRAVEL' | 'SKIPPED'
  const [search, setSearch] = useState('');

  // Filter only rows that are abnormal/suspicious
  const suspiciousRows = rows.filter(r => {
    const isDuration = Boolean(r.isDurationAnomaly);
    const isDistance = r.isDistanceAnomaly || r.distanceWarning === 'WARNING';
    const isTravel = r.isTravelAnomaly;
    const isSkipped = r.isSkipped;
    const isSuspicious = isDuration || isDistance || isTravel || isSkipped || Boolean(r.earlyReason);
    if (!isSuspicious) return false;
    if (filterAnomalyType === 'DURATION') return isDuration;
    if (filterAnomalyType === 'DISTANCE') return isDistance;
    if (filterAnomalyType === 'TRAVEL') return isTravel;
    if (filterAnomalyType === 'SKIPPED') return isSkipped;
    return true;
  });
  const filteredRows = search ? suspiciousRows.filter(r => r.customerName.toLowerCase().includes(search.toLowerCase()) || r.salesmanName.toLowerCase().includes(search.toLowerCase()) || (r.earlyReason || '').toLowerCase().includes(search.toLowerCase()) || (r.travelAnomalyReason || '').toLowerCase().includes(search.toLowerCase()) || (r.reason || '').toLowerCase().includes(search.toLowerCase())) : suspiciousRows;

  // Export only suspicious attendances to CSV
  const exportSuspiciousCsv = () => {
    if (filteredRows.length === 0) {
      alert('Tidak ada data absensi janggal untuk diekspor.');
      return;
    }
    const headers = ['No', 'Tanggal', 'Salesman', 'Klaster', 'Kode Toko', 'Nama Toko', 'Jam In', 'Jam Out', 'Durasi (Menit)', 'Status Durasi', 'Deviasi GPS (Meter)', 'Peringatan Jarak', 'Jarak dari Toko Sebelumnya (Km)', 'Waktu Tempuh Perjalanan (Menit)', 'Peringatan Jeda Travel', 'Jenis Anomali', 'Alasan Checkout Dini / Travel', 'Catatan / Keterangan Toko', 'Effective Call', 'Nilai Order (Rp)'];
    const csvData = filteredRows.map((r, idx) => [idx + 1, r.date, `"${(r.salesmanName || '').replace(/"/g, '""')}"`, `"${(r.clusterName || '').replace(/"/g, '""')}"`, `"${r.customerId}"`, `"${(r.customerName || '').replace(/"/g, '""')}"`, r.timeIn || '-', r.timeOut || '-', r.durationMinutes || 0, r.isDurationAnomaly ? 'Di bawah batas aturan' : r.durationMinutes==null?'Tidak tersedia':'Normal', r.deviationMeters || 0, r.distanceWarning === 'WARNING' ? 'Di luar radius aturan' : 'OK', r.travelDistanceKm || 0, r.travelDurationMinutes || 0, r.isTravelAnomaly ? 'Jeda Travel Janggal' : 'Normal', `"${[r.isDurationAnomaly ? 'Durasi di bawah batas aturan' : '', r.isDistanceAnomaly ? 'Deviasi GPS melebihi radius' : '', r.isTravelAnomaly ? 'Jeda Travel Janggal' : '', r.isSkipped ? 'Belum Dikunjungi/Kelewat' : ''].filter(Boolean).join(', ')}"`, `"${(r.travelAnomalyReason || r.earlyReason || '-').replace(/"/g, '""')}"`, `"${(r.reason || r.remark || '-').replace(/"/g, '""')}"`, r.effectiveCall === 'Y' ? 'EC' : 'Non-EC', r.orderAmount || 0]);
    const csvContent = '\uFEFF' + [headers.join(','), ...csvData.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    downloadOperationalFile(blob,`AUDIT_ABSENSI_JANGGAL_${new Date().toISOString().split('T')[0]}.csv`,'text/csv;charset=utf-8;');
  };
  return <div className="space-y-4">
      {/* 1. Header Banner & Audit Warning */}
      <SuspiciousAttendanceSummary exportSuspiciousCsv={exportSuspiciousCsv} filterAnomalyType={filterAnomalyType} setFilterAnomalyType={setFilterAnomalyType} suspiciousRows={suspiciousRows} />

      {/* 2. Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs" />
          <input type="text" placeholder="Cari nama toko, salesman, atau alasan..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-surface rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none" />
        </div>
        <span className="text-xs text-on-surface-variant font-semibold">
          Menampilkan {filteredRows.length} dari {suspiciousRows.length} temuan
        </span>
      </div>

      {/* 3. Dedicated Anomaly Table */}
      <SuspiciousAttendanceRows filteredRows={filteredRows} onSelectRow={onSelectRow} />
    </div>;
};
