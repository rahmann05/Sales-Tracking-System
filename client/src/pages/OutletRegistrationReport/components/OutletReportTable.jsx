import { DataTable } from '../../../shared/components/common/DataTable';
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
  embedded = false,
}) => {
  return (
    <div className={embedded ? 'overflow-hidden' : 'outlet-reg-section-card p-0 overflow-hidden'}>
      {isLoading ? (
        <div className="py-16 text-center text-xs text-on-surface-variant">
          Memuat data laporan registrasi outlet...
        </div>
      ) : data.length === 0 ? (
        <div className="py-16 text-center text-xs text-on-surface-variant italic">
          Tidak ada data pendaftaran outlet yang cocok dengan filter.
        </div>
      ) : (
        <div className="overflow-x-auto w-full mobile-card-table-wrapper">
          <DataTable className="w-full text-left text-xs border-collapse mobile-card-table">
            <thead className="bg-surface-container/70 border-b border-border-glass">
              <tr>
                <th className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider py-3.5 px-4 w-32 whitespace-nowrap">
                  Kode Outlet
                </th>
                <th className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider py-3.5 px-4 min-w-[200px]">
                  Nama Outlet & Alamat
                </th>
                <th className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider py-3.5 px-4 whitespace-nowrap">
                  Area / Divisi
                </th>
                <th className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider py-3.5 px-4 whitespace-nowrap">
                  Channel
                </th>
                <th className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider py-3.5 px-4 whitespace-nowrap">
                  Salesman & SPV
                </th>
                <th className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider py-3.5 px-4 whitespace-nowrap">
                  Status
                </th>
                <th className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider py-3.5 px-4 text-center w-44 whitespace-nowrap">
                  Aksi Admin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glass/40">
              {data.map((item) => (
                <OutletReportTableRow
                  key={item.id}
                  item={item}
                  onOpenPdf={onOpenPdf}
                  onOpenFinalize={onOpenFinalize}
                />
              ))}
            </tbody>
          </DataTable>
        </div>
      )}
    </div>
  );
};
