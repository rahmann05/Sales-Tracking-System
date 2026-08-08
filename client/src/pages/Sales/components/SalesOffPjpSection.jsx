import React from 'react';
import { LuStore, LuInfo } from 'react-icons/lu';
import { SalesOffPjpCard } from './SalesOffPjpCard';

/**
 * SalesOffPjpSection Component
 * Single Responsibility: Render the list of Off-PJP attendance cards for the Sales view.
 * Dynamic Behavior:
 * - If NO records exist: returns NULL (strictly leaves zero empty space or margin).
 * - If records exist: stacks cards downwards in a clean responsive grid.
 * 1 File = 1 Component
 */
export const SalesOffPjpSection = ({ offPjpAttendances = [] }) => {
  // If there are no off-PJP records, render nothing without empty spacing
  if (!offPjpAttendances || offPjpAttendances.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border-glass pt-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-on-surface">
              Absen Kunjungan Toko di Luar RJP
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-tertiary/15 text-tertiary border border-tertiary/30">
              {offPjpAttendances.length} Kunjungan Mitigasi
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Presensi di luar jadwal rute (toko tutup / order dadakan) untuk mitigasi target harian.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant bg-surface-variant/30 px-3 py-1.5 rounded-xl border border-border-glass">
          <LuInfo className="text-tertiary text-xs shrink-0" />
          <span>Status validasi otomatis diperbarui oleh Supervisor</span>
        </div>
      </div>

      {/* Grid of Off-PJP Cards Stacking Downwards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {offPjpAttendances.map((item, idx) => (
          <SalesOffPjpCard key={item.id || idx} item={item} index={idx} />
        ))}
      </div>
    </div>
  );
};
