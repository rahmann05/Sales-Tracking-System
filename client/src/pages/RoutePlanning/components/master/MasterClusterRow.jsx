import React from 'react';
import { LuMapPin, LuStore, LuUserCheck } from 'react-icons/lu';
import '../../../../styles/components/MasterClusterRow.css';

/**
 * MasterClusterRow Component
 * Single Responsibility: Render a single row inside MasterClusterTable.
 * 1 File = 1 Component
 */
export const MasterClusterRow = ({ cluster, onEdit, onDelete, onManageOutlets, deletingId }) => {
  return (
    <tr className="master-cluster-row hover:bg-surface-variant/20 transition-colors">
      {/* Code */}
      <td data-label="Kode" className="master-cluster-td whitespace-nowrap">
        <span className="master-cluster-code">{cluster.code}</span>
      </td>

      {/* Cluster Name & Sub-Districts */}
      <td data-label="Cluster" className="master-cluster-td">
        <div className="master-cluster-name">{cluster.name}</div>
        <div className="text-xs text-on-surface-variant mt-0.5">
          {cluster.tradeType === 'MIXED'
            ? 'Campuran · perlu dipisahkan'
            : cluster.tradeType === 'MODERN_TRADE'
            ? 'Modern Trade'
            : cluster.tradeType === 'GENERAL_TRADE'
            ? 'General Trade'
            : 'Jenis mengikuti outlet pertama'}
        </div>
        <div className="master-cluster-subdistricts">
          {cluster.subDistricts?.length ? cluster.subDistricts.join(', ') : 'Area mengikuti outlet terdaftar'}
        </div>
      </td>

      {/* Region */}
      <td data-label="Region" className="master-cluster-td whitespace-nowrap">
        <span className="master-cluster-region-badge">
          <LuMapPin className="text-xs text-primary shrink-0" />
          <span>{cluster.region}</span>
        </span>
      </td>

      {/* Quota / Allocated Outlets */}
      <td data-label="Kuota" className="master-cluster-td whitespace-nowrap">
        <span className="master-cluster-quota-badge">
          <LuStore className="text-sm shrink-0" />
          <span>{cluster.allocatedOutletsCount} Toko</span>
        </span>
      </td>

      {/* Sales Bertugas */}
      <td data-label="Sales" className="master-cluster-td whitespace-nowrap">
        <div className="flex items-center gap-1.5 font-bold text-on-surface text-xs">
          <LuUserCheck className="text-primary text-sm shrink-0" />
          <span>{cluster.assignedSalesName || 'Belum Ditugaskan'}</span>
        </div>
      </td>

      {/* Supervisor Wilayah */}
      <td data-label="Supervisor" className="master-cluster-td whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span>{cluster.assignedSpvName || '-'}</span>
        </div>
      </td>

      {/* Status */}
      <td data-label="Status" className="master-cluster-td whitespace-nowrap">
        <span className="inline-flex flex-row items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 inline-block"></span>
          <span>{cluster.status || 'Active'}</span>
        </span>
      </td>

      {/* Aksi */}
      <td data-label="Aksi" className="master-cluster-td text-center whitespace-nowrap">
        <div className="flex flex-col gap-1 w-full min-w-[70px] max-w-[84px] mx-auto">
          {onManageOutlets && (
            <button
              type="button"
              className="w-full px-2.5 py-1 text-[11px] font-bold rounded-lg border border-border-glass bg-surface hover:bg-surface-container text-on-surface transition-colors cursor-pointer shadow-2xs text-center whitespace-nowrap"
              onClick={() => onManageOutlets(cluster)}
            >
              Outlet
            </button>
          )}
          <button
            type="button"
            disabled={Boolean(deletingId) || cluster.name === 'Belum Ditugaskan'}
            onClick={() => onEdit && onEdit(cluster)}
            className="w-full px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-colors cursor-pointer border border-blue-500/20 shadow-2xs text-center whitespace-nowrap disabled:opacity-50"
            title="Edit Klaster"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={Boolean(deletingId) || cluster.name === 'Belum Ditugaskan'}
            onClick={() => {
              if (window.confirm(`Hapus klaster ${cluster.name}?`)) {
                onDelete && onDelete(cluster.id);
              }
            }}
            className="w-full px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 transition-colors cursor-pointer border border-red-500/20 shadow-2xs text-center whitespace-nowrap disabled:opacity-50"
            title="Hapus Klaster"
          >
            {deletingId === cluster.id ? 'Menghapus…' : 'Hapus'}
          </button>
        </div>
      </td>
    </tr>
  );
};
