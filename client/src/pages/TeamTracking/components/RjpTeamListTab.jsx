import React from 'react';
import { FiUser } from 'react-icons/fi';

/**
 * RjpTeamListTab Component
 * Standardized equal height card layout: h-full min-h-[220px] flex flex-col justify-between
 */
export const RjpTeamListTab = ({ filteredRjpTeams }) => {
  return (
    <div className="space-y-4">
      {filteredRjpTeams.length === 0 ? (
        <div className="p-8 text-center bg-surface border border-border-glass rounded-2xl text-on-surface-variant text-xs font-medium">
          Belum ada Tim RJP / Kunjungan tertentu yang dibuat.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {filteredRjpTeams.map((team) => (
            <div key={team.id} className="app-card h-full min-h-[220px] flex flex-col justify-between border-l-4 border-l-secondary shadow-sm">
              <div>
                <div className="flex-between border-b border-border-glass pb-3 mb-3">
                  <div>
                    <span className="badge-secondary text-[10px] uppercase tracking-wider mb-1 inline-block">
                      TIM RJP KHUSUS
                    </span>
                    <h4 className="card-title text-base font-bold text-on-surface line-clamp-1">{team.name}</h4>
                    <p className="card-subtitle text-xs text-on-surface-variant">Klaster: {team.cluster}</p>
                  </div>
                  <span className="caption-mono font-bold text-right block text-sm shrink-0">
                    {team.routesCount} Rute Outlet
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Supervisor Penanggung Jawab:</span>
                    <span className="font-bold text-on-surface">{team.spvName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Dibuat Oleh:</span>
                    <span className="font-semibold text-on-surface">
                      {team.createdBy} ({team.createdAt})
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border-glass mt-auto min-h-[56px]">
                <h5 className="text-xs font-bold text-on-surface">Anggota Sales Ditugaskan:</h5>
                <div className="flex flex-wrap gap-2">
                  {team.memberSalesNames.map((name, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-secondary/10 border border-secondary/30 text-on-surface font-semibold text-xs rounded-lg flex items-center gap-1"
                    >
                      <FiUser className="text-xs" /> {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
