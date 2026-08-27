import React, { useState } from 'react';
import {
  LuClock,
  LuMapPin,
  LuImage,
  LuShieldAlert,
  LuFileSpreadsheet,
  LuSearch,
  LuExternalLink,
  LuCircleCheck,
  LuNavigation,
} from 'react-icons/lu';
import { FiAlertTriangle } from 'react-icons/fi';

/**
 * SuspiciousAttendanceTable Component
 * Single Responsibility: Dedicated table and audit dashboard for abnormal / suspicious attendances
 * (Early checkout < 5 minutes, GPS deviation > 50 meters, Travel time gaps e.g. 2km in 2 hours, and Skipped visits).
 */
export const SuspiciousAttendanceTable = ({
  rows = [],
  isLoading = false,
  onSelectRow,
}) => {
  const [filterAnomalyType, setFilterAnomalyType] = useState('ALL'); // 'ALL' | 'DURATION' | 'DISTANCE' | 'TRAVEL' | 'SKIPPED'
  const [search, setSearch] = useState('');

  // Filter only rows that are abnormal/suspicious
  const suspiciousRows = rows.filter((r) => {
    const isDuration = r.isDurationAnomaly || (r.durationMinutes > 0 && r.durationMinutes < 5);
    const isDistance = r.isDistanceAnomaly || r.distanceWarning === 'WARNING' || r.deviationMeters > 50;
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

  const filteredRows = search
    ? suspiciousRows.filter(
        (r) =>
          r.customerName.toLowerCase().includes(search.toLowerCase()) ||
          r.salesmanName.toLowerCase().includes(search.toLowerCase()) ||
          (r.earlyReason || '').toLowerCase().includes(search.toLowerCase()) ||
          (r.travelAnomalyReason || '').toLowerCase().includes(search.toLowerCase()) ||
          (r.reason || '').toLowerCase().includes(search.toLowerCase())
      )
    : suspiciousRows;

  // Export only suspicious attendances to CSV
  const exportSuspiciousCsv = () => {
    if (filteredRows.length === 0) {
      alert('Tidak ada data absensi janggal untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Tanggal',
      'Salesman',
      'Klaster',
      'Kode Toko',
      'Nama Toko',
      'Jam In',
      'Jam Out',
      'Durasi (Menit)',
      'Status Durasi',
      'Deviasi GPS (Meter)',
      'Peringatan Jarak',
      'Jarak dari Toko Sebelumnya (Km)',
      'Waktu Tempuh Perjalanan (Menit)',
      'Peringatan Jeda Travel',
      'Jenis Anomali',
      'Alasan Checkout Dini / Travel',
      'Catatan / Keterangan Toko',
      'Effective Call',
      'Nilai Order (Rp)',
    ];

    const csvData = filteredRows.map((r, idx) => [
      idx + 1,
      r.date,
      `"${(r.salesmanName || '').replace(/"/g, '""')}"`,
      `"${(r.clusterName || '').replace(/"/g, '""')}"`,
      `"${r.customerId}"`,
      `"${(r.customerName || '').replace(/"/g, '""')}"`,
      r.timeIn || '-',
      r.timeOut || '-',
      r.durationMinutes || 0,
      r.durationMinutes < 5 ? '< 5 Menit (Janggal)' : 'Normal',
      r.deviationMeters || 0,
      r.distanceWarning === 'WARNING' ? 'Di Luar Radius (>50m)' : 'OK',
      r.travelDistanceKm || 0,
      r.travelDurationMinutes || 0,
      r.isTravelAnomaly ? 'Jeda Travel Janggal' : 'Normal',
      `"${[
        r.isDurationAnomaly ? 'Durasi <5m' : '',
        r.isDistanceAnomaly ? 'Deviasi GPS >50m' : '',
        r.isTravelAnomaly ? 'Jeda Travel Janggal' : '',
        r.isSkipped ? 'Belum Dikunjungi/Kelewat' : '',
      ]
        .filter(Boolean)
        .join(', ')}"`,
      `"${(r.travelAnomalyReason || r.earlyReason || '-').replace(/"/g, '""')}"`,
      `"${(r.reason || r.remark || '-').replace(/"/g, '""')}"`,
      r.effectiveCall === 'Y' ? 'EC' : 'Non-EC',
      r.orderAmount || 0,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...csvData.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AUDIT_ABSENSI_JANGGAL_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Banner & Audit Warning */}
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
            <LuShieldAlert className="text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-rose-700 m-0 uppercase tracking-tight">
                Tabel Khusus Audit Absensi Janggal & Anomali Lapangan
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                {suspiciousRows.length} Temuan
              </span>
            </div>
            <p className="text-xs text-rose-800/80 m-0 mt-0.5">
              Daftar kunjungan yang memerlukan evaluasi supervisor: durasi kunjungan &lt; 5 menit, deviasi GPS &gt; 50 meter, jeda perjalanan antar toko tidak wajar (misal 2 km vs 2 jam), atau jadwal terlewat.
            </p>
          </div>
        </div>

        {/* Filter Pills & Export */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <button
            type="button"
            onClick={() => setFilterAnomalyType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterAnomalyType === 'ALL'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-surface text-on-surface-variant border border-border-glass hover:bg-surface-container'
            }`}
          >
            Semua ({suspiciousRows.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterAnomalyType('TRAVEL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterAnomalyType === 'TRAVEL'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-surface text-on-surface-variant border border-border-glass hover:bg-surface-container'
            }`}
          >
            <LuCar className="text-xs" /> Jeda Travel
          </button>
          <button
            type="button"
            onClick={() => setFilterAnomalyType('DURATION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterAnomalyType === 'DURATION'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-surface text-on-surface-variant border border-border-glass hover:bg-surface-container'
            }`}
          >
            <LuClock className="text-xs" /> Durasi &lt; 5m
          </button>
          <button
            type="button"
            onClick={() => setFilterAnomalyType('DISTANCE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterAnomalyType === 'DISTANCE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-surface text-on-surface-variant border border-border-glass hover:bg-surface-container'
            }`}
          >
            <LuMapPin className="text-xs" /> Radius GPS &gt; 50m
          </button>
          <button
            type="button"
            onClick={() => setFilterAnomalyType('SKIPPED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterAnomalyType === 'SKIPPED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-surface text-on-surface-variant border border-border-glass hover:bg-surface-container'
            }`}
          >
            ⏳ Terlewat
          </button>

          <button
            type="button"
            onClick={exportSuspiciousCsv}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer ml-auto"
            title="Ekspor Daftar Anomali ke Excel/CSV"
          >
            <LuFileSpreadsheet /> Ekspor Audit
          </button>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs" />
          <input
            type="text"
            placeholder="Cari nama toko, salesman, atau alasan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <span className="text-xs text-on-surface-variant font-semibold">
          Menampilkan {filteredRows.length} dari {suspiciousRows.length} temuan
        </span>
      </div>

      {/* 3. Dedicated Anomaly Table */}
      <div className="bg-surface border border-rose-500/20 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-rose-500/10 border-b border-rose-500/20 text-[11px] font-black text-rose-800 uppercase tracking-wider">
                <th className="py-3 px-3 text-center">No</th>
                <th className="py-3 px-3">Salesman & Klaster</th>
                <th className="py-3 px-3">Outlet / Toko</th>
                <th className="py-3 px-2 text-center">Jam In / Out</th>
                <th className="py-3 px-3 text-center">Jarak & Jeda Travel</th>
                <th className="py-3 px-3 text-center">Durasi di Toko</th>
                <th className="py-3 px-3 text-center">Deviasi GPS</th>
                <th className="py-3 px-3">Jenis Anomali & Temuan</th>
                <th className="py-3 px-3 text-center">Bukti Foto</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, idx) => {
                const isShort = r.isDurationAnomaly || (r.durationMinutes > 0 && r.durationMinutes < 5);
                const isFar = r.isDistanceAnomaly || r.distanceWarning === 'WARNING';
                const isTravel = r.isTravelAnomaly;
                const isSkipped = r.isSkipped;

                return (
                  <tr
                    key={r.id || idx}
                    className="hover:bg-rose-500/5 transition-colors border-b border-border-glass/60 cursor-pointer"
                    onClick={() => onSelectRow && onSelectRow(r)}
                  >
                    <td className="py-3 px-3 text-center font-mono text-[11px] font-bold text-on-surface-variant">
                      {idx + 1}
                    </td>

                    {/* Salesman */}
                    <td className="py-3 px-3 font-semibold text-on-surface">
                      <div className="font-bold">{r.salesmanName}</div>
                      <div className="text-[10px] text-on-surface-variant">{r.clusterName}</div>
                    </td>

                    {/* Outlet */}
                    <td className="py-3 px-3 text-on-surface max-w-[200px]">
                      <div className="font-bold truncate" title={r.customerName}>
                        {r.customerName}
                      </div>
                      <div className="text-[10px] text-on-surface-variant truncate font-mono" title={r.customerAddress}>
                        {r.customerId} • {r.customerAddress}
                      </div>
                    </td>

                    {/* Time In / Out */}
                    <td className="py-3 px-2 text-center font-mono text-[11px]">
                      <div className="text-emerald-600 font-semibold">{r.timeIn || '-'}</div>
                      <div className="text-on-surface-variant">{r.timeOut || '-'}</div>
                    </td>

                    {/* Travel Time & Distance */}
                    <td className="py-3 px-3 text-center font-mono">
                      {r.prevStopName ? (
                        <div
                          className={`inline-block p-1.5 rounded-lg text-[11px] ${
                            isTravel
                              ? 'bg-rose-500/15 text-rose-700 border border-rose-500/30 font-bold animate-pulse'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          <div>{r.travelDistanceKm} km</div>
                          <div className="font-bold">{r.travelDurationFormatted}</div>
                        </div>
                      ) : (
                        <span className="text-on-surface-variant/40">-</span>
                      )}
                    </td>

                    {/* Duration Flag */}
                    <td className="py-3 px-3 text-center">
                      <div
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black font-mono ${
                          isShort
                            ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                            : 'bg-surface-container text-on-surface font-semibold'
                        }`}
                      >
                        <LuClock className="text-xs" />
                        {r.durationFormatted || `${r.durationMinutes}m`}
                      </div>
                      {isShort && (
                        <div className="text-[10px] font-black text-rose-600 mt-0.5 inline-flex items-center gap-0.5">
                          <LuClock className="text-[10px]" /> Terlalu Singkat
                        </div>
                      )}
                    </td>

                    {/* GPS Deviation Flag */}
                    <td className="py-3 px-3 text-center">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${
                          isFar
                            ? 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-600'
                        }`}
                      >
                        <LuMapPin className="text-xs" />
                        {r.deviationMeters || 0} m
                      </div>
                      {isFar && (
                        <div className="text-[10px] font-bold text-amber-700 mt-0.5 inline-flex items-center gap-0.5">
                          <LuShieldAlert className="text-[10px]" /> Diluar Radius
                        </div>
                      )}
                    </td>

                    {/* Anomaly Badge & Notes */}
                    <td className="py-3 px-3 max-w-[240px]">
                      <div className="space-y-1">
                        {isTravel && (
                          <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-[10.5px] text-rose-900 font-bold flex items-center gap-1">
                            <LuCar className="text-xs shrink-0" />
                            <span>{r.travelAnomalyReason}</span>
                          </div>
                        )}
                        {isShort && (
                          <div className="p-1 rounded-md bg-rose-500/10 text-rose-800 text-[10.5px] font-semibold flex items-center gap-1">
                            <LuClock className="text-xs shrink-0" />
                            <span>Durasi &lt;5m {r.earlyReason ? `: "${r.earlyReason}"` : ''}</span>
                          </div>
                        )}
                        {isFar && (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 text-[10px] font-black border border-amber-500/20">
                            Deviasi Radius GPS ({r.deviationMeters}m)
                          </span>
                        )}
                        {isSkipped && (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-gray-500/10 text-gray-700 text-[10px] font-black border border-gray-500/20">
                            Jadwal PJP Terlewat
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Photo Evidence */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {r.photoIn ? (
                          <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-bold" title="Foto Check-In Tersedia">
                            <LuImage />
                          </span>
                        ) : null}
                        {r.photoOut ? (
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-bold" title="Foto Check-Out Tersedia">
                            <LuImage />
                          </span>
                        ) : null}
                        {!r.photoIn && !r.photoOut && (
                          <span className="text-xs text-on-surface-variant/40">-</span>
                        )}
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRow && onSelectRow(r);
                        }}
                        className="p-1.5 rounded-xl bg-surface-container hover:bg-rose-500/15 text-on-surface hover:text-rose-700 transition-all border border-border-glass text-xs cursor-pointer"
                        title="Lihat Rincian Lengkap & Foto"
                      >
                        <LuExternalLink />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LuCircleCheck className="text-emerald-500 text-2xl" />
                      <span className="font-bold text-sm text-on-surface">Tidak Ditemukan Absensi Janggal</span>
                      <p className="text-xs text-on-surface-variant m-0 max-w-sm">
                        Semua kunjungan berjalan sesuai SOP: durasi di toko &gt;= 5 menit, GPS dalam radius aman, dan jeda perjalanan antar-titik wajar.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

