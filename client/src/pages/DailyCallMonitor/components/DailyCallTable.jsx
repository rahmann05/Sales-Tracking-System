import React from 'react';
import { DailyCallTableRow } from './DailyCallTableRow';
import { LuFileText, LuInbox } from 'react-icons/lu';

/**
 * DailyCallTable Component
 * Single Responsibility: Render table header, list of Daily Call rows, and empty state.
 */
export const DailyCallTable = ({ rows = [], isLoading = false, onSelectRow }) => {
  if (isLoading) {
    return (
      <div className="bg-surface border border-border-glass rounded-2xl p-12 text-center shadow-sm space-y-3">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-on-surface-variant font-semibold">
          Memuat data rekapitulasi Daily Call...
        </p>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="bg-surface border border-border-glass rounded-2xl p-12 text-center shadow-sm space-y-3">
        <LuInbox className="text-4xl text-on-surface-variant/40 mx-auto" />
        <h4 className="text-sm font-bold text-on-surface">Tidak Ada Data Kunjungan</h4>
        <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
          Belum ada data rekaman kunjungan Daily Call untuk filter tanggal dan sales yang dipilih.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-glass rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container border-b border-border-glass text-[11px] font-black text-on-surface-variant uppercase tracking-wider">
              <th className="py-3 px-3 text-center">No</th>
              <th className="py-3 px-3">Salesman</th>
              <th className="py-3 px-3">Jam In / Out</th>
              <th className="py-3 px-3">Durasi</th>
              <th className="py-3 px-3">Customer ID & Nama Toko</th>
              <th className="py-3 px-3">Sub Channel</th>
              <th className="py-3 px-3 text-center">Call Status</th>
              <th className="py-3 px-3 text-right">Order (Rp) / SKU</th>
              <th className="py-3 px-3">Alasan / Catatan</th>
              <th className="py-3 px-3 text-center">Deviasi GPS</th>
              <th className="py-3 px-3 text-center">Foto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <DailyCallTableRow key={row.id} row={row} onSelectRow={onSelectRow} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-surface-container/60 border-t border-border-glass flex items-center justify-between text-xs text-on-surface-variant">
        <span>Menampilkan <strong>{rows.length}</strong> catatan kunjungan toko</span>
        <span className="font-mono text-[11px]">Format: ND6 Distribution Daily Call Report</span>
      </div>
    </div>
  );
};

