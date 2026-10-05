import React from 'react';
import { DailyCallTableRow } from './DailyCallTableRow';
import { LuFileText, LuInbox } from 'react-icons/lu';

/**
 * DailyCallTable Component
 * Single Responsibility: Render table header, list of Daily Call rows, and empty state.
 */
export const DailyCallTable = ({ rows = [], isLoading = false, onSelectRow }) => {
  const [pageSize, setPageSize] = React.useState(50);
  const [currentPage, setCurrentPage] = React.useState(1);

  // Reset to page 1 if rows length changes significantly
  React.useEffect(() => {
    setCurrentPage(1);
  }, [rows.length]);

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-on-surface-variant font-semibold">
          Memuat data rekapitulasi Daily Call...
        </p>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="p-12 text-center space-y-3">
        <LuInbox className="text-4xl text-on-surface-variant/40 mx-auto" />
        <h4 className="text-sm font-bold text-on-surface">Tidak Ada Data Kunjungan</h4>
        <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
          Belum ada data rekaman kunjungan Daily Call untuk filter tanggal dan sales yang dipilih.
        </p>
      </div>
    );
  }

  const isAll = pageSize === 'ALL';
  const limit = isAll ? rows.length : Number(pageSize);
  const totalPages = isAll ? 1 : Math.ceil(rows.length / limit);
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * limit;
  const paginatedRows = isAll ? rows : rows.slice(startIndex, startIndex + limit);

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto mobile-card-table-wrapper">
        <table className="w-full text-left border-collapse mobile-card-table">
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
            {paginatedRows.map((row) => (
              <DailyCallTableRow key={row.id} row={row} onSelectRow={onSelectRow} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-surface-container/60 border-t border-border-glass flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
        <div className="flex items-center gap-3">
          <span>
            Menampilkan <strong>{isAll ? rows.length : `${startIndex + 1}–${Math.min(startIndex + limit, rows.length)}`}</strong> dari total <strong>{rows.length}</strong> kunjungan
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-surface border border-border-glass rounded-lg px-2 py-0.5 text-xs font-semibold text-on-surface"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="ALL">Semua</option>
            </select>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg border border-border-glass bg-surface hover:bg-surface-variant disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs text-on-surface"
            >
              Sebelumnya
            </button>
            <span className="text-[11px] font-mono font-bold">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg border border-border-glass bg-surface hover:bg-surface-variant disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs text-on-surface"
            >
              Berikutnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

