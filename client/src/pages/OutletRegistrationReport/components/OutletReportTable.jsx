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
            <thead className="bg-surface-variant/30">
              <tr>
                <th className="font-semibold text-on-surface-variant border-b border-border-glass">
                  Kode Outlet
                </th>
                <th className="font-semibold text-on-surface-variant border-b border-border-glass">
                  Nama Outlet & Alamat
                </th>
                <th className="font-semibold text-on-surface-variant border-b border-border-glass">
                  Area / Divisi
                </th>
                <th className="font-semibold text-on-surface-variant border-b border-border-glass">
                  Channel
                </th>
                <th className="font-semibold text-on-surface-variant border-b border-border-glass">
                  Salesman & SPV
                </th>
                <th className="font-semibold text-on-surface-variant border-b border-border-glass">
                  Status
                </th>
                <th className="font-semibold text-on-surface-variant border-b border-border-glass text-center">
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
          </DataTable>
        </div>
      )}
    </div>
  );
};
