import React from 'react';
import { LuFileSpreadsheet, LuPlus, LuShieldCheck } from 'react-icons/lu';

/**
 * RjpOpsHeader Component
 * Single Responsibility: Operational Manager Header Bar with Cluster Creation & Spreadsheet Import triggers.
 */
export const RjpOpsHeader = ({ onNavigateCreateCluster, onOpenImportModal }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-5 bg-surface border border-border-glass rounded-2xl shadow-sm items-start md:items-center justify-between">
      <div className="flex flex-col gap-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-700/10 text-cyan-700 rounded-full text-xs font-bold uppercase tracking-wider w-fit">
          <LuShieldCheck />
          <span>Operational Manager Workstation</span>
        </div>
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight m-0">Master Cluster & Alokasi Region RJP</h1>
        <p className="text-sm text-on-surface-variant m-0">
          Tentukan pembagian wilayah, kuota outlet Bandung Barat & Cimahi, atau impor langsung dari spreadsheet
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap shrink-0">
        <button
          type="button"
          onClick={onOpenImportModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-variant/30 hover:bg-surface-variant/60 text-on-surface font-semibold text-sm rounded-xl border border-border-glass transition-colors"
          id="btn-import-spreadsheet"
        >
          <LuFileSpreadsheet className="text-base text-emerald-600" />
          <span>Impor Spreadsheet</span>
        </button>

        <button
          type="button"
          onClick={onNavigateCreateCluster}
          className="flex items-center gap-2 px-4 py-2.5 bg-on-surface text-surface hover:bg-on-surface/90 font-semibold text-sm rounded-xl transition-colors"
          id="btn-create-cluster"
        >
          <LuPlus className="text-base" />
          <span>Buat Cluster Baru</span>
        </button>
      </div>
    </div>
  );
};
