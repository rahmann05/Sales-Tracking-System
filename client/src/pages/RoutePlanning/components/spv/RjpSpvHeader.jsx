import React from 'react';
import { LuRotateCw, LuUsers, LuShieldCheck } from 'react-icons/lu';
import { PageHeader } from '../../../../components/common/PageHeader';

/**
 * RjpSpvHeader Component
 * Single Responsibility: Supervisor Header Bar with Auto-Rolling execution trigger.
 * Standardized with universal PageHeader and Apple Editorial monochrome style.
 */
export const RjpSpvHeader = ({ onOpenAutoRollingModal }) => {
  return (
    <PageHeader
      badge={
        <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
          <LuShieldCheck className="text-sm" /> MATRIKS ROLLING JADWAL RJP
        </span>
      }
      title="Matriks Distribusi & Jadwal Rolling Sales"
      subtitle="Atur penugasan wilayah dan rotasi hari kunjungan (Senin - Sabtu) untuk setiap Sales Rep"
      actions={
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={onOpenAutoRollingModal}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-primary text-on-primary hover:bg-primary/90 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            id="btn-auto-rolling"
          >
            <LuRotateCw className="text-base" />
            <span>Auto-Rolling Rotasi Jadwal</span>
          </button>
        </div>
      }
    />
  );
};
