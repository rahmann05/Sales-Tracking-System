import React from 'react';
import { OutletReportTableRow } from './OutletReportTableRow';

/**
 * OutletReportTable Component
 * Single Responsibility: Render table container and header columns for Admin Report.
 */
export const OutletReportTable = ({
  data = [],
  isLoading = false,
  onOpenPdf,
  onOpenFinalize,
}) => {
  return (
    <div className="outlet-reg-section-card p-0 overflow-hidden">
      {isLoading ? (
        <div className="py-16 text-center text-xs text-on-surface-variant">
          Memuat data laporan registrasi outlet...
        </div>
      ) : data.length === 0 ? (
        <div className="py-16 text-center text-xs text-on-surface-variant italic">
          Tidak ada data pendaftaran outlet yang cocok dengan filter.
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead className="bg-surface-variant/30">
              <tr>
                <th className="py-3 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Kode Outlet
                </th>
                <th className="py-3 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Nama Outlet & Alamat
                </th>
                <th className="py-3 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Area / Divisi
                </th>
                <th className="py-3 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Channel
                </th>
                <th className="py-3 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Salesman & SPV
                </th>
                <th className="py-3 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Status
                </th>
                <th className="py-3 px-4 font-semibold text-on-surface-variant border-b border-border-glass text-center">
                  Aksi Admin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glass">
              {data.map((item) => (
                <OutletReportTableRow
                  key={item.id}
                  item={item}
                  onOpenPdf={onOpenPdf}
                  onOpenFinalize={onOpenFinalize}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
