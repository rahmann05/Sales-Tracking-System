import React from 'react';
import { LuFileCheck, LuSearch } from 'react-icons/lu';

const STATUS_FILTERS = [
  { id: 'SUBMITTED', label: 'Menunggu Approval' },
  { id: 'SPV_APPROVED', label: 'Disetujui SPV' },
  { id: 'OPS_APPROVED', label: 'Disetujui Ops Manager' },
  { id: 'REGISTERED_ACTIVE', label: 'Sudah Aktif di Sistem' },
  { id: 'REJECTED', label: 'Ditolak' },
  { id: 'ALL', label: 'Semua Status' },
];

/**
 * OutletApprovalHeader Component
 * Single Responsibility: Render approval page header, role info, search box, and status filter buttons.
 */
export const OutletApprovalHeader = ({
  userRole,
  searchQuery,
  onSearchChange,
  filterStatus,
  onSelectFilter,
  statusCounts = {},
  onRefresh,
}) => {
  return (
    <div className="outlet-reg-header-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-extrabold flex items-center gap-1.5">
              <LuFileCheck /> WORKFLOW PERSETUJUAN OUTLET
            </span>
            <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-bold text-on-surface">
              Role: {userRole}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-on-surface tracking-tight m-0">
            Persetujuan Pendaftaran Outlet Baru
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 m-0">
            Verifikasi titik koordinat fisik, kelayakan toko, syarat pembayaran, dan persetujuan PJP harian
          </p>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs" />
            <input
              type="text"
              placeholder="Cari toko / sales..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="outlet-reg-input pl-8 py-1.5 text-xs w-48 sm:w-60"
            />
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="outlet-reg-btn-outline text-xs py-1.5 px-3"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border-glass overflow-x-auto pb-1">
        {STATUS_FILTERS.map((st) => {
          const count = st.id === 'ALL' ? statusCounts.TOTAL || 0 : statusCounts[st.id] || 0;
          const isActive = filterStatus === st.id;

          return (
            <button
              key={st.id}
              type="button"
              onClick={() => onSelectFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface text-on-surface-variant border-border-glass hover:bg-surface-container'
              }`}
            >
              <span>{st.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
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
