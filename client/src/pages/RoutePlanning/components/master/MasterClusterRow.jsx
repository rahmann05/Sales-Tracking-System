import React from 'react';
import { LuMapPin, LuStore, LuUserCheck } from 'react-icons/lu';
import '../../../../styles/components/MasterClusterRow.css';

/**
 * MasterClusterRow Component
 * Single Responsibility: Render a single row inside MasterClusterTable.
 * 1 File = 1 Component
 */
export const MasterClusterRow = ({ cluster, onEdit, onDelete }) => {
  return (
    <tr className="master-cluster-row">
      {/* Code */}
      <td data-label="Kode" className="master-cluster-td">
        <span className="master-cluster-code">{cluster.code}</span>
      </td>

      {/* Cluster Name & Sub-Districts */}
      <td data-label="Cluster" className="master-cluster-td">
        <div className="master-cluster-name">{cluster.name}</div>
        <div className="master-cluster-subdistricts">
          {Array.isArray(cluster.subDistricts) ? cluster.subDistricts.join(', ') : 'Area Bandung Barat'}
        </div>
      </td>

      {/* Region */}
      <td data-label="Region" className="master-cluster-td">
        <span className="master-cluster-region-badge">
          <LuMapPin className="text-xs text-primary" />
          {cluster.region}
        </span>
      </td>

      {/* Quota / Allocated Outlets */}
      <td data-label="Kuota" className="master-cluster-td">
        <span className="master-cluster-quota-badge">
          <LuStore className="text-sm" />
          {cluster.allocatedOutletsCount} Toko
        </span>
      </td>

      {/* Sales Bertugas */}
      <td data-label="Sales" className="master-cluster-td">
        <div className="flex items-center gap-1.5 font-bold text-on-surface">
          <LuUserCheck className="text-primary text-sm shrink-0" />
          <span>{cluster.assignedSalesName || 'Belum Ditugaskan'}</span>
        </div>
      </td>

      {/* Supervisor Wilayah */}
      <td data-label="Supervisor" className="master-cluster-td">
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span>{cluster.assignedSpvName || '-'}</span>
        </div>
      </td>

      {/* Status */}
      <td data-label="Status" className="master-cluster-td">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600">
          ● {cluster.status || 'Active'}
        </span>
      </td>

      {/* Aksi */}
      <td className="master-cluster-td text-center mobile-full-width">
        <div className="flex items-center justify-center gap-2 w-full">
          <button 
            onClick={() => onEdit && onEdit(cluster)}
            className="flex-1 md:flex-initial py-2 md:py-1.5 px-3 text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 font-bold rounded-lg text-xs transition-colors cursor-pointer"
            title="Edit Klaster"
          >
            Edit
          </button>
          <button 
            onClick={() => {
              if (window.confirm(`Hapus klaster ${cluster.name}?`)) {
                onDelete && onDelete(cluster.id);
              }
            }}
            className="flex-1 md:flex-initial py-2 md:py-1.5 px-3 text-red-600 bg-red-500/10 hover:bg-red-500/20 font-bold rounded-lg text-xs transition-colors cursor-pointer"
            title="Hapus Klaster"
          >
            Hapus
          </button>
        </div>
      </td>
    </tr>
  );
};
