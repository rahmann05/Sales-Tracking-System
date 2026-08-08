import React from 'react';
import { FiCalendar } from 'react-icons/fi';
import { LuStore, LuUserCheck, LuShield } from 'react-icons/lu';
import { Avatar } from '../../../components/common/Avatar';

/**
 * RjpTeamCard Component
 * Single Responsibility: Render a 1-row full width card for RJP Field Team.
 * Clean, spacious horizontal layout preventing any text truncation.
 */
export const RjpTeamCard = ({ team }) => {
  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-l-4 border-l-emerald-500">
      {/* Left: Team Info & Cluster */}
      <div className="flex-1 min-w-[240px]">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
            TIM RJP KHUSUS
          </span>
          <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
            <LuShield className="text-xs text-primary" /> SPV: {team.spvName}
          </span>
        </div>
        <h4 className="text-base font-extrabold text-on-surface leading-tight">
          {team.name}
        </h4>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Klaster Wilayah: <span className="font-semibold text-on-surface">{team.cluster}</span>
        </p>
      </div>

      {/* Middle: Active Schedule Days & Quota */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
            Jadwal Kunjungan:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(team.assignedDays || ['Senin']).map((day, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-emerald-500/10 text-emerald-600 font-bold text-xs rounded-full border border-emerald-500/20 flex items-center gap-1.5"
              >
                <FiCalendar className="text-xs" /> Hari {day}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-low border border-border-glass px-3.5 py-1.5 rounded-xl text-center">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Target Kunjungan</span>
          <span className="text-sm font-extrabold text-primary flex items-center justify-center gap-1">
            <LuStore className="text-xs" /> {team.routesCount || 10} Outlet
          </span>
        </div>
      </div>

      {/* Right: Registered Sales Reps */}
      <div className="border-t lg:border-t-0 lg:border-l border-border-glass pt-3 lg:pt-0 lg:pl-4 min-w-[200px]">
        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
          Sales Lapangan ({team.memberSalesNames?.length || 0}):
        </span>
        <div className="flex flex-wrap gap-2">
          {team.memberSalesNames?.map((name, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-surface-container-high/60 border border-border-glass px-3 py-1.5 rounded-xl"
            >
              <Avatar name={name} size="sm" />
              <div className="text-left">
                <span className="font-extrabold text-on-surface text-xs block leading-none">{name}</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                  <LuUserCheck className="text-[10px]" /> Aktif Bertugas
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
