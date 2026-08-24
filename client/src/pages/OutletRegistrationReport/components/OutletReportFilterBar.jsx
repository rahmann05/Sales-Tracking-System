import React from 'react';
import { LuSearch, LuListFilter } from 'react-icons/lu';

/**
 * OutletReportFilterBar Component
 * Single Responsibility: Render filter dropdowns and search bar for report query parameters.
 */
export const OutletReportFilterBar = ({
  filters,
  onUpdateFilter,
  onReset,
}) => {
  return (
    <div className="outlet-reg-section-card mb-4 p-4">
      <div className="flex items-center gap-2 mb-3">
        <LuListFilter className="text-primary text-sm" />
        <span className="text-xs font-extrabold text-on-surface">Filter Laporan Registrasi</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="outlet-reg-label">Cari Nama / Kode / Sales</label>
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs" />
            <input
              type="text"
              placeholder="Cari toko, kode, alamat..."
              value={filters.search}
              onChange={(e) => onUpdateFilter('search', e.target.value)}
              className="outlet-reg-input pl-8 text-xs py-1.5"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="outlet-reg-label">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onUpdateFilter('status', e.target.value)}
            className="outlet-reg-input text-xs py-1.5 font-bold"
          >
            <option value="ALL">Semua Status</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="SPV_APPROVED">SPV_APPROVED</option>
            <option value="OPS_APPROVED">OPS_APPROVED</option>
            <option value="REGISTERED_ACTIVE">REGISTERED_ACTIVE</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        {/* Area */}
        <div>
          <label className="outlet-reg-label">Area</label>
          <select
            value={filters.area}
            onChange={(e) => onUpdateFilter('area', e.target.value)}
            className="outlet-reg-input text-xs py-1.5"
          >
            <option value="ALL">Semua Area</option>
            <option value="CIMAHI">Cimahi</option>
            <option value="KAB_BANDUNG_BARAT">Kab. Bandung Barat</option>
            <option value="KAB_BANDUNG">Kab. Bandung</option>
            <option value="KOTA_BANDUNG">Kota Bandung</option>
          </select>
        </div>

        {/* Channel */}
        <div>
          <label className="outlet-reg-label">Channel</label>
          <select
            value={filters.channel}
            onChange={(e) => onUpdateFilter('channel', e.target.value)}
            className="outlet-reg-input text-xs py-1.5"
          >
            <option value="ALL">Semua Channel</option>
            <option value="GENERAL_TRADE">General Trade (GT)</option>
            <option value="MODERN_TRADE">Modern Trade (MT)</option>
          </select>
        </div>

        {/* Divisi */}
        <div>
          <label className="outlet-reg-label">Divisi</label>
          <select
            value={filters.division}
            onChange={(e) => onUpdateFilter('division', e.target.value)}
            className="outlet-reg-input text-xs py-1.5"
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
