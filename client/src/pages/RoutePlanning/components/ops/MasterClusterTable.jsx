import React from 'react';
import { MasterClusterRow } from './MasterClusterRow';
import '../../../../styles/components/MasterClusterTable.css';

/**
 * MasterClusterTable Component
 * Single Responsibility: Table view container rendering all Master RJP Clusters.
 * 1 File = 1 Component
 */
export const MasterClusterTable = ({ clusters = [], onEdit, onDelete }) => {
  return (
    <div className="master-cluster-table-card">
      <div className="master-cluster-table-header">
        <div>
          <h3 className="master-cluster-table-title">Daftar Master Cluster & Penugasan Supervisor</h3>
          <p className="master-cluster-table-subtitle">
            Master blueprint yang didistribusikan ke Supervisor untuk dibuatkan jadwal rolling sales
          </p>
        </div>
        <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-bold text-on-surface-variant">
          {clusters.length} Cluster Terdaftar
        </span>
      </div>

      <div className="master-cluster-table-container">
        <table className="master-cluster-table">
          <thead>
            <tr>
              <th className="master-cluster-th">Kode</th>
              <th className="master-cluster-th">Nama Cluster & Wilayah</th>
              <th className="master-cluster-th">Region</th>
              <th className="master-cluster-th">Kuota Outlet</th>
              <th className="master-cluster-th">Supervisor Penanggung Jawab</th>
              <th className="master-cluster-th">Status</th>
              <th className="master-cluster-th text-center">Aksi</th>
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
