import { DataTable } from '../../../../shared/components/common/DataTable';
import React, { useState } from 'react';
import { MasterClusterRow } from './MasterClusterRow';

/**
 * MasterClusterTable Component
 * Single Responsibility: Table view container rendering all Master RJP Clusters.
 */
export const MasterClusterTable = ({ clusters = [], onEdit, onDelete, onManageOutlets, loading=false, deletingId=null }) => {
  const [query,setQuery]=useState('');
  const filtered=clusters.filter(cluster=>[cluster.name,cluster.region,cluster.assignedSalesName,cluster.assignedSpvName].join(' ').toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="bg-surface border border-border-glass rounded-2xl shadow-sm overflow-hidden flex flex-col">
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

      <label className="app-field p-4">Cari kluster<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nama, region, sales, atau supervisor"/></label>
      {loading&&<p role="status" className="p-4">Memuat kluster…</p>}
      {!loading&&!filtered.length&&<p className="p-6 text-on-surface-variant">{query?'Tidak ada kluster yang cocok.':'Belum ada kluster. Buat kluster untuk mulai membagi wilayah.'}</p>}
      <div className="overflow-x-auto w-full mobile-card-table-wrapper">
        <DataTable className="w-full text-left text-sm border-collapse mobile-card-table">
          <thead className="bg-surface-variant/30">
            <tr>
              <th className="font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">Kode</th>
              <th className="font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">Nama Cluster & Wilayah</th>
              <th className="font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">Region</th>
              <th className="font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">Outlet Aktif</th>
              <th className="font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">Sales Bertugas</th>
              <th className="font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">Supervisor Wilayah</th>
              <th className="font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">Status</th>
              <th className="font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass text-center">Aksi</th>
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
