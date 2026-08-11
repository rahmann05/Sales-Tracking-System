import React from 'react';
import { LuFileSpreadsheet, LuPlus, LuShieldCheck } from 'react-icons/lu';
import '../../../../styles/components/RjpOpsHeader.css';

/**
 * RjpOpsHeader Component
 * Single Responsibility: Operational Manager Header Bar with Cluster Creation & Spreadsheet Import triggers.
 * 1 File = 1 Component
 */
export const RjpOpsHeader = ({ onNavigateCreateCluster, onOpenImportModal }) => {
  return (
    <div className="rjp-ops-header">
      <div className="rjp-ops-header-info">
        <div className="rjp-ops-badge">
          <LuShieldCheck />
          <span>Operational Manager Workstation</span>
        </div>
        <h1 className="rjp-ops-title">Master Cluster & Alokasi Region RJP</h1>
        <p className="rjp-ops-subtitle">
          Tentukan pembagian wilayah, kuota outlet Bandung Barat & Cimahi, atau impor langsung dari spreadsheet
        </p>
      </div>

      <div className="rjp-ops-actions">
        <button
          type="button"
          onClick={onOpenImportModal}
          className="rjp-ops-btn-import"
          id="btn-import-spreadsheet"
        >
          <LuFileSpreadsheet className="text-base text-emerald-600" />
          <span>Impor Spreadsheet</span>
        </button>

        <button
          type="button"
          onClick={onNavigateCreateCluster}
          className="rjp-ops-btn-create"
          id="btn-create-cluster"
        >
          <LuPlus className="text-base" />
          <span>Buat Cluster Baru</span>
        </button>
      </div>
    </div>
  );
};
