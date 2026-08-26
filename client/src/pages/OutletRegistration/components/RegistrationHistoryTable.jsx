import React from 'react';
import { LuClock, LuMapPin, LuFileSpreadsheet, LuFileText, LuDownload } from 'react-icons/lu';
import {
  exportCustomerExcel,
  exportCustomerNd6Txt,
  exportCustomerSummaryTxt,
} from '../../../utils/customerExport';

const STATUS_BADGE_MAP = {
  SUBMITTED: {
    label: 'Menunggu Approval',
    cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  SPV_APPROVED: {
    label: 'Disetujui SPV',
    cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  OPS_APPROVED: {
    label: 'Disetujui Ops Manager',
    cls: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  REGISTERED_ACTIVE: {
    label: 'Aktif di Sistem',
    cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  REJECTED: {
    label: 'Ditolak',
    cls: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
};

/**
 * RegistrationHistoryTable Component
 * Single Responsibility: Render table of submitted outlet registrations for Sales.
 */
export const RegistrationHistoryTable = ({
  submissions = [],
  isLoading = false,
  onRefresh,
  onSelectDetail,
}) => {
  return (
    <div className="outlet-reg-section-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border-glass">
        <div>
          <h3 className="text-base font-extrabold text-on-surface m-0 flex items-center gap-2">
            <LuClock className="text-primary" /> Riwayat Pengajuan Registrasi Outlet
          </h3>
          <p className="text-xs text-on-surface-variant m-0 mt-0.5">
            Status verifikasi dan persetujuan bertingkat (Salesman &rarr; SPV &rarr; Ops Manager &rarr; Admin)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => exportCustomerExcel(submissions, `Riwayat_Registrasi_Sales_${new Date().toISOString().split('T')[0]}.csv`)}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
            title="Ekspor ke Excel / CSV"
          >
            <LuFileSpreadsheet /> Excel
          </button>
          <button
            type="button"
            onClick={() => exportCustomerNd6Txt(submissions, `IMPORT_CUSTOMER_ND6_${new Date().toISOString().split('T')[0]}.txt`)}
            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
            title="Ekspor Format ND6 TXT"
          >
            <LuFileText /> ND6 TXT
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="outlet-reg-btn-outline text-xs py-1.5 px-3"
          >
            {isLoading ? 'Memuat...' : 'Refresh'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-on-surface-variant">
          Memuat data riwayat pendaftaran...
        </div>
      ) : submissions.length === 0 ? (
        <div className="py-12 text-center text-xs text-on-surface-variant italic">
          Belum ada riwayat pengajuan registrasi outlet.
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead className="bg-surface-variant/30">
              <tr>
                <th className="py-3 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Tanggal
                </th>
                <th className="py-3 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Nama Toko & Alamat
                </th>
                <th className="py-3 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Area / Divisi
                </th>
                <th className="py-3 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Channel
                </th>
                <th className="py-3 px-4 font-semibold text-on-surface-variant border-b border-border-glass">
                  Status Persetujuan
                </th>
                <th className="py-3 px-4 font-semibold text-on-surface-variant border-b border-border-glass text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glass">
              {submissions.map((item) => {
                const badge = STATUS_BADGE_MAP[item.registrationStatus] || STATUS_BADGE_MAP.SUBMITTED;

                return (
                  <tr key={item.id} className="hover:bg-surface-variant/20 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-on-surface-variant font-mono">
                      {new Date(item.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-on-surface">{item.name}</div>
                      <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <LuMapPin className="text-primary text-xs shrink-0" />
                        <span>{item.address}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-on-surface">{item.area}</div>
                      <div className="text-[10px] text-on-surface-variant">{item.division}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container border border-border-glass">
                        {item.channel === 'MODERN_TRADE' ? 'MT' : 'GT'} - {item.subChannel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                      {item.customerCode && (
                        <div className="text-[10px] font-mono font-bold text-emerald-600 mt-0.5">
                          Kode: {item.customerCode}
                        </div>
                      )}
                      {item.rejectionNote && (
                        <div className="text-[10px] text-red-600 mt-1 font-medium">
                          Alasan: {item.rejectionNote}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectDetail(item)}
                        className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs font-bold text-primary transition-all border border-border-glass"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
