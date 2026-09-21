import React from 'react';
import { LuFileSpreadsheet, LuPlus, LuShieldCheck } from 'react-icons/lu';
import { PageHeader } from '../../../../shared/components/common/PageHeader';

/**
 * RjpMasterHeader Component
 * Single Responsibility: Master Cluster Header Bar with Cluster Creation & Spreadsheet Import triggers.
 */
export const RjpMasterHeader = ({ onNavigateCreateCluster, onOpenImportModal }) => {
  return (
    <PageHeader
      badge={
        <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
          <LuShieldCheck className="text-sm" /> PENGATURAN KLUSTER WILAYAH RJP
        </span>
      }
      title="Master Cluster & Alokasi Region RJP"
      subtitle="Tentukan pembagian wilayah, kuota outlet Bandung Barat & Cimahi, atau impor langsung dari spreadsheet"
      actions={
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={onOpenImportModal}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-surface hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl border border-border-glass shadow-xs transition-colors cursor-pointer"
            id="btn-import-spreadsheet"
          >
            <LuFileSpreadsheet className="text-base text-primary" />
            <span>Impor Spreadsheet</span>
          </button>

          <button
            type="button"
            onClick={onNavigateCreateCluster}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-primary text-on-primary hover:bg-primary/90 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            id="btn-create-cluster"
          >
            <LuPlus className="text-base" />
            <span>Buat Cluster Baru</span>
          </button>
        </div>
      }
    />
  );
};
