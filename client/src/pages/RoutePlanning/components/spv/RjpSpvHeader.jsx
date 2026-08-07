import React from 'react';
import { LuRotateCw, LuUsers } from 'react-icons/lu';
import '../../../../styles/components/RjpSpvHeader.css';

/**
 * RjpSpvHeader Component
 * Single Responsibility: Supervisor Header Bar with Auto-Rolling execution trigger.
 * 1 File = 1 Component
 */
export const RjpSpvHeader = ({ onOpenAutoRollingModal }) => {
  return (
    <div className="rjp-spv-header">
      <div className="flex flex-col gap-1">
        <div className="rjp-spv-badge">
          <LuUsers />
          <span>Supervisor Workstation</span>
        </div>
        <h1 className="rjp-spv-title">Matriks Distribusi & Jadwal Rolling Sales</h1>
        <p className="rjp-spv-subtitle">
          Atur penugasan wilayah dan rotasi hari kunjungan (Senin - Sabtu) untuk setiap Sales Rep
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenAutoRollingModal}
          className="rjp-spv-btn-autoroll"
          id="btn-auto-rolling"
        >
          <LuRotateCw className="text-base" />
          <span>Auto-Rolling Rotasi Jadwal</span>
        </button>
      </div>
    </div>
  );
};
