import React from 'react';
import { useApp } from '../../../context/AppContext';
import { LuUsers, LuCircleCheck, LuClock, LuShieldCheck, LuStore, LuCompass } from 'react-icons/lu';
import { FiAlertCircle } from 'react-icons/fi';
import { Avatar } from '../../../components/common/Avatar';

/**
 * SupervisorHeader Component
 * Single Responsibility: Display SPV Profile & Overview Metrics summary.
 * 1 File per Component
 */
export const SupervisorHeader = ({
  approvalCount = 0,
  incidentCount = 0,
  activeTab = 'my_rjp',
  onSelectTab = () => {},
}) => {
  const { user, salesStops = [] } = useApp();
  const completedTeamStops = salesStops.filter((s) => s.status === 'COMPLETED' || s.status === 'ORDERED').length;

  return (
    <div className="bg-surface border border-border-glass rounded-3xl p-5 md:p-6 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-5">
      {/* Left: SPV Profile */}
      <div className="flex items-center gap-4">
        <Avatar
          src={user?.avatar}
          name={user?.name || 'Ahmad Subagja'}
          size="lg"
          className="rounded-2xl ring-2 ring-primary/30 shrink-0"
        />
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl md:text-2xl font-black text-on-surface tracking-tight">
              {user?.name || 'Ahmad Subagja'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <LuShieldCheck className="text-xs" />
              {user?.roleLabel || 'Supervisor Operasional'}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
            <LuStore className="text-xs text-primary shrink-0" />
            <span>Supervisi 3 Tim RJP (Cimahi, Padalarang, Lembang) • 30 Master Outlet</span>
          </p>
        </div>
      </div>

      {/* Right: 4 Quick KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 md:gap-3 text-xs w-full xl:w-auto">
        {/* 1. Kunjungan Supervisi SPV */}
        <button
          type="button"
          onClick={() => onSelectTab('my_rjp')}
          className={`p-3 rounded-2xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
            activeTab === 'my_rjp'
              ? 'bg-primary/10 border-primary/40 shadow-sm ring-1 ring-primary/30'
              : 'bg-surface-variant/30 border-border-glass hover:bg-surface-variant/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-on-surface-variant font-medium">RJP Supervisi</span>
            <LuCompass className="text-primary text-sm" />
          </div>
          <div className="font-extrabold text-on-surface text-base">
            1 <span className="text-[11px] font-normal text-on-surface-variant">/ 4 Toko Selesai</span>
          </div>
        </button>

        {/* 2. Kunjungan Selesai Tim Sales */}
        <button
          type="button"
          onClick={() => onSelectTab('performance')}
          className={`p-3 rounded-2xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
            activeTab === 'performance'
              ? 'bg-primary/10 border-primary/40 shadow-sm ring-1 ring-primary/30'
              : 'bg-surface-variant/30 border-border-glass hover:bg-surface-variant/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-on-surface-variant font-medium">Realisasi Tim</span>
            <LuCircleCheck className="text-primary text-sm" />
          </div>
          <div className="font-extrabold text-on-surface text-base">
            {completedTeamStops} <span className="text-[11px] font-normal text-on-surface-variant">/ {salesStops.length} Toko</span>
          </div>
        </button>

        {/* 3. Menunggu Approval */}
        <button
          type="button"
          onClick={() => onSelectTab('approvals')}
          className={`p-3 rounded-2xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
            activeTab === 'approvals'
              ? 'bg-blue-500/10 border-blue-500/40 shadow-sm ring-1 ring-blue-500/30'
              : 'bg-surface-variant/30 border-border-glass hover:bg-surface-variant/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-on-surface-variant font-medium">Antrean Approval</span>
            <LuClock className="text-blue-600 text-sm" />
          </div>
          <div className="font-extrabold text-blue-600 text-base flex items-center gap-1">
            {approvalCount}
            <span className="text-[11px] font-medium text-on-surface-variant">Pending</span>
          </div>
        </button>

        {/* 4. Laporan Toko Tutup */}
        <button
          type="button"
          onClick={() => onSelectTab('incidents')}
          className={`p-3 rounded-2xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
            activeTab === 'incidents'
              ? 'bg-rose-500/10 border-rose-500/40 shadow-sm ring-1 ring-rose-500/30'
              : 'bg-surface-variant/30 border-border-glass hover:bg-surface-variant/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-on-surface-variant font-medium">Toko Tutup</span>
            <FiAlertCircle className="text-rose-600 text-sm" />
          </div>
          <div className="font-extrabold text-rose-600 text-base flex items-center gap-1">
            {incidentCount}
            <span className="text-[11px] font-medium text-on-surface-variant">Kendala</span>
          </div>
        </button>
      </div>
    </div>
  );
};
