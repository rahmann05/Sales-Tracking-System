import React from 'react';
import { LuFileCheck, LuSearch, LuFileSpreadsheet, LuFileText, LuRotateCw } from 'react-icons/lu';
import { PageHeader } from '../../../shared/components/common/PageHeader';
import {
  exportCustomerExcel,
  exportCustomerNd6Txt,
} from '../../../utils/customerExport';

const STATUS_FILTERS = [
  { id: 'SUBMITTED', label: 'Menunggu Approval' },
  { id: 'SPV_APPROVED', label: 'Disetujui SPV' },
  { id: 'REGISTERED_ACTIVE', label: 'Aktif di Sistem' },
  { id: 'REJECTED', label: 'Ditolak' },
  { id: 'ALL', label: 'Semua Status' },
];

/**
 * OutletApprovalHeader Component
 * Single Responsibility: Standardized PageHeader with search, exports, and status filter pills for NOO approval.
 */
export const OutletApprovalHeader = ({
  userRole,
  items = [],
  searchQuery,
  onSearchChange,
  filterStatus,
  onSelectFilter,
  statusCounts = {},
  onRefresh,
}) => {
  return (
    <div className="space-y-4">
      <PageHeader
        badge={
          <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuFileCheck className="text-sm" /> PERSETUJUAN OUTLET NOO
          </span>
        }
        title="Persetujuan Pendaftaran Outlet Baru"
        subtitle="Verifikasi data fisik toko, titik koordinat GPS, kelayakan kredit, dan persetujuan penambahan rute PJP salesman."
        stats={[
          { label: 'Menunggu Approval', value: statusCounts.SUBMITTED || 0, color: (statusCounts.SUBMITTED || 0) > 0 ? 'rose' : 'emerald' },
          { label: 'Disetujui SPV', value: statusCounts.SPV_APPROVED || 0, color: 'neutral' },
          { label: 'Total Pengajuan', value: items.length, color: 'neutral' },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs" />
              <input
                type="text"
                placeholder="Cari toko / sales..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="outlet-reg-input pl-8 py-2 text-xs w-44 sm:w-56 rounded-xl"
              />
            </div>

            <button
              type="button"
              onClick={() => exportCustomerExcel(items, `Approval_Outlet_${filterStatus}_${new Date().toISOString().split('T')[0]}.csv`)}
              className="px-3 py-2 rounded-xl bg-surface border border-border-glass hover:bg-surface-container text-on-surface text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Ekspor ke Excel / CSV"
            >
              <LuFileSpreadsheet className="text-sm" /> <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={() => exportCustomerNd6Txt(items, `IMPORT_CUSTOMER_ND6_${new Date().toISOString().split('T')[0]}.txt`)}
              className="px-3 py-2 rounded-xl bg-surface border border-border-glass hover:bg-surface-container text-on-surface text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Ekspor Format ND6 TXT"
            >
              <LuFileText className="text-sm" /> <span>ND6 TXT</span>
            </button>

            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-xl bg-surface border border-border-glass text-on-surface hover:bg-surface-variant/40 transition-all cursor-pointer"
              title="Segarkan Data"
            >
              <LuRotateCw className="text-sm" />
            </button>
          </div>
        }
      />

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {STATUS_FILTERS.map((st) => {
          const count = st.id === 'ALL' ? statusCounts.TOTAL || items.length : statusCounts[st.id] || 0;
          const isActive = filterStatus === st.id;

          return (
            <button
              key={st.id}
              type="button"
              onClick={() => onSelectFilter(st.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface text-on-surface-variant border-border-glass hover:bg-surface-variant/40 hover:text-on-surface'
              }`}
            >
              <span>{st.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-container font-mono text-on-surface'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
