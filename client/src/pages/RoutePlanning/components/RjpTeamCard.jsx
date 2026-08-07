import React from 'react';
import { FiCalendar } from 'react-icons/fi';
import { Avatar } from '../../../components/common/Avatar';

/**
 * RjpTeamCard Component
 * Equal height standard: h-full min-h-[260px] flex flex-col justify-between
 */
export const RjpTeamCard = ({ team }) => {
  return (
    <div className="app-card h-full min-h-[260px] flex flex-col justify-between border-l-4 border-l-tertiary shadow-sm hover:shadow-md transition-all">
      {/* Top Header */}
      <div>
        <div className="flex-between border-b border-border-glass pb-3 mb-3">
          <div>
            <span className="badge-tertiary text-[10px] uppercase tracking-wider mb-1 inline-block">
              TIM RJP KHUSUS
            </span>
            <h4 className="card-title text-base font-bold text-on-surface line-clamp-1">{team.name}</h4>
            <p className="card-subtitle text-xs text-on-surface-variant">Klaster: {team.cluster}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="caption-mono font-bold block text-sm">{team.routesCount} Outlet</span>
            <span className="text-[11px] text-on-surface-variant">SPV: {team.spvName}</span>
          </div>
        </div>

        {/* Days Badges */}
        <div className="space-y-1.5 mb-3 min-h-[52px]">
          <h5 className="text-xs font-bold text-on-surface">Jadwal Hari Kunjungan Active:</h5>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(team.assignedDays || ['Senin', 'Kamis']).map((day, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-tertiary/10 text-tertiary font-bold text-xs rounded-full border border-tertiary/30 flex items-center gap-1"
              >
                <FiCalendar className="text-xs" /> Hari {day}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Members List (Bottom Aligned) */}
      <div className="space-y-2 pt-2 border-t border-border-glass mt-auto min-h-[64px]">
        <h5 className="text-xs font-bold text-on-surface">
          Anggota Sales Terdaftar ({team.memberSalesNames?.length || 0}):
        </h5>
        <div className="flex flex-wrap gap-2">
          {team.memberSalesNames?.map((name, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-surface-variant/30 border border-border-glass px-2.5 py-1 rounded-xl text-xs"
            >
              <Avatar name={name} size="sm" />
              <span className="font-bold text-on-surface text-xs">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
