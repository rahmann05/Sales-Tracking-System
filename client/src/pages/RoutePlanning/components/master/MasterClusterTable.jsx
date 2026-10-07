import { DataTable } from '../../../../shared/components/common/DataTable';
import React, { useState } from 'react';
import { MasterClusterRow } from './MasterClusterRow';
import { LuSearch } from 'react-icons/lu';

/**
 * MasterClusterTable Component
 * Single Responsibility: Table view container rendering all Master RJP Clusters.
 */
export const MasterClusterTable = ({ clusters = [], onEdit, onDelete, onManageOutlets, loading=false, deletingId=null }) => {
  const [query, setQuery] = useState('');
  const filtered = clusters.filter(cluster => [cluster.name, cluster.region, cluster.assignedSalesName, cluster.assignedSpvName].join(' ').toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="bg-surface border border-border-glass rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-border-glass bg-surface">
        <div>
          <h3 className="text-base font-extrabold text-on-surface m-0">Daftar kluster dan penanggung jawab</h3>
          <p className="text-xs text-on-surface-variant m-0 mt-1">
            Wilayah dan outlet menjadi dasar penyusunan jadwal kunjungan tim.
          </p>
        </div>
        <span className="px-3 py-1 bg-surface-variant/50 border border-border-glass rounded-full text-xs font-bold text-on-surface-variant whitespace-nowrap">
          {clusters.length} Cluster Terdaftar
        </span>
      </div>

      <div className="p-4 border-b border-border-glass bg-surface-container-low/40">
        <div className="relative max-w-md">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama kluster, region, sales, atau supervisor..."
            className="w-full pl-9 pr-3 h-10 bg-surface rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {loading && <p role="status" className="p-6 text-xs text-on-surface-variant font-semibold">Memuat kluster…</p>}
      {!loading && !filtered.length && (
        <p className="p-8 text-center text-xs text-on-surface-variant">
          {query ? 'Tidak ada kluster yang cocok dengan pencarian.' : 'Belum ada kluster. Buat kluster untuk mulai membagi wilayah.'}
        </p>
      )}

      <div className="overflow-x-auto w-full mobile-card-table-wrapper">
        <DataTable className="w-full min-w-[980px] text-left text-xs border-collapse mobile-card-table">
          <thead className="bg-surface-container/70">
            <tr className="border-b border-border-glass">
              <th className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider py-3.5 px-4 w-20 whitespace-nowrap">Kode</th>
              <th className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider py-3.5 px-4 min-w-[180px]">Nama Cluster & Wilayah</th>
              <th className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider py-3.5 px-4 whitespace-nowrap">Region</th>
              <th className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider py-3.5 px-4 whitespace-nowrap">Outlet Aktif</th>
              <th className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider py-3.5 px-4 whitespace-nowrap">Sales Bertugas</th>
              <th className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider py-3.5 px-4 whitespace-nowrap">Supervisor Wilayah</th>
              <th className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider py-3.5 px-4 whitespace-nowrap">Status</th>
              <th className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider py-3.5 px-4 text-center w-28 whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cluster) => (
              <MasterClusterRow
                key={cluster.id}
                cluster={cluster}
                onEdit={onEdit}
                onDelete={onDelete} onManageOutlets={onManageOutlets} deletingId={deletingId}
              />
            ))}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
};
