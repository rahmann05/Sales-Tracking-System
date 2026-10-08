import React from 'react';
import { LuSearch, LuListFilter } from 'react-icons/lu';
import { useApp } from '../../../context/AppContext';

/**
 * OutletReportFilterBar Component
 * Single Responsibility: Render filter dropdowns and search bar for report query parameters.
 */
export const OutletReportFilterBar = ({
  filters,
  onUpdateFilter,
  onReset,
  embedded = false,
}) => {
  const { clusters } = useApp();
  return (
    <div className={embedded ? 'space-y-3' : 'bg-surface border border-border-glass rounded-2xl mb-4 p-4 shadow-xs'}>
      <div className="flex items-center gap-2 mb-2">
        <LuListFilter className="text-primary text-sm" />
        <span className="text-xs font-bold text-on-surface">Filter Laporan Registrasi</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Cari Nama / Kode / Sales</label>
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs pointer-events-none" />
            <input
              type="text"
              placeholder="Cari toko, kode, alamat..."
              value={filters.search}
              onChange={(e) => onUpdateFilter('search', e.target.value)}
              className="w-full pl-8 pr-3 h-10 bg-surface-container rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onUpdateFilter('status', e.target.value)}
            className="w-full px-3 h-10 bg-surface-container rounded-xl text-xs font-bold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="SUBMITTED">Menunggu persetujuan</option>
            <option value="SPV_APPROVED">Disetujui SPV</option>
            <option value="REGISTERED_ACTIVE">Aktif di sistem</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </div>

        {/* Area / Klaster */}
        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Klaster Wilayah</label>
          <select
            value={filters.area}
            onChange={(e) => onUpdateFilter('area', e.target.value)}
            className="w-full px-3 h-10 bg-surface-container rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="ALL">Semua Klaster</option>
            {clusters && clusters.length > 0 && (
              clusters.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))
            )}
          </select>
        </div>

        {/* Channel */}
        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Channel</label>
          <select
            value={filters.channel}
            onChange={(e) => onUpdateFilter('channel', e.target.value)}
            className="w-full px-3 h-10 bg-surface-container rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="ALL">Semua Channel</option>
            <option value="GENERAL_TRADE">General Trade (GT)</option>
            <option value="MODERN_TRADE">Modern Trade (MT)</option>
          </select>
        </div>

        {/* Divisi */}
        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Divisi</label>
          <select
            value={filters.division}
            onChange={(e) => onUpdateFilter('division', e.target.value)}
            className="w-full px-3 h-10 bg-surface-container rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="ALL">Semua Divisi</option>
            <option value="UNICHARM">UNICHARM</option>
            <option value="BELFOODS">BELFOODS</option>
            <option value="GENERAL">GENERAL</option>
          </select>
        </div>
      </div>
    </div>
  );
};
