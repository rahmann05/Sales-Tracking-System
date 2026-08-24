import React from 'react';
import { OutletApprovalTableRow } from './OutletApprovalTableRow';

/**
 * OutletApprovalTable Component
 * Single Responsibility: Render table wrapper and map approval queue rows.
 */
export const OutletApprovalTable = ({ items = [], isLoading = false, onReview }) => {
  return (
    <div className="outlet-reg-section-card p-0 overflow-hidden">
      {isLoading ? (
        <div className="py-16 text-center text-xs text-on-surface-variant">
          Memuat data pengajuan outlet...
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-xs text-on-surface-variant italic">
          Tidak ada data pengajuan outlet dengan filter saat ini.
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead className="bg-surface-variant/30">
              <tr>
                <th className="py-3.5 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Tanggal Pengajuan
                </th>
                <th className="py-3.5 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Nama Toko & Alamat
                </th>
                <th className="py-3.5 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Salesman Pengaju
                </th>
                <th className="py-3.5 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Wilayah & Divisi
                </th>
                <th className="py-3.5 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Channel & Payment
                </th>
                <th className="py-3.5 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Status
                </th>
                <th className="py-3.5 px-4 font-semibold text-on-surface-variant border-b border-border-glass text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glass">
              {items.map((item) => (
                <OutletApprovalTableRow
                  key={item.id}
                  item={item}
                  onReview={onReview}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
