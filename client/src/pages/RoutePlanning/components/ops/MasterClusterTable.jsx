import React from 'react';
import { MasterClusterRow } from './MasterClusterRow';

/**
 * MasterClusterTable Component
 * Single Responsibility: Table view container rendering all Master RJP Clusters.
 */
export const MasterClusterTable = ({ clusters = [], onEdit, onDelete }) => {
  return (
    <div className="bg-surface border border-border-glass rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-border-glass bg-surface">
        <div>
          <h3 className="text-base font-extrabold text-on-surface m-0">Daftar Master Cluster & Penugasan Supervisor</h3>
          <p className="text-xs text-on-surface-variant m-0 mt-1">
            Master blueprint yang didistribusikan ke Supervisor untuk dibuatkan jadwal rolling sales
          </p>
        </div>
        <span className="px-3 py-1 bg-surface-variant/50 border border-border-glass rounded-full text-xs font-bold text-on-surface-variant whitespace-nowrap">
          {clusters.length} Cluster Terdaftar
        </span>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm border-collapse min-w-[800px]">
          <thead className="bg-surface-variant/30">
            <tr>
              <th className="py-3 px-4 font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">Kode</th>
              <th className="py-3 px-4 font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">Nama Cluster & Wilayah</th>
              <th className="py-3 px-4 font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">Region</th>
              <th className="py-3 px-4 font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">Kuota Outlet</th>
              <th className="py-3 px-4 font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">Supervisor Penanggung Jawab</th>
              <th className="py-3 px-4 font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass">Status</th>
              <th className="py-3 px-4 font-semibold text-on-surface-variant text-xs uppercase tracking-wider border-b border-border-glass text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {clusters.map((cluster) => (
              <MasterClusterRow 
                key={cluster.id} 
                cluster={cluster} 
                onEdit={onEdit} 
                onDelete={onDelete} 
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
