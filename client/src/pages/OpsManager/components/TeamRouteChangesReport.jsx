import React from 'react';
import { LuUsers, LuRefreshCw, LuSlash } from 'react-icons/lu';
import { FiPlusCircle } from 'react-icons/fi';
import { useApp } from '../../../context/AppContext';
import { RouteChangesTable } from './RouteChangesTable';
import { OffPjpAbsenTable } from './OffPjpAbsenTable';

/**
 * TeamRouteChangesReport Component
 * Groups all field route changes, closed shop reports, direct reroutes, and Off-PJP requests per Supervisor Team for Operational Manager
 */
export const TeamRouteChangesReport = ({ incidents = [] }) => {
  const { supervisorTeams, offPjpAttendances = [] } = useApp();

  // Map incidents into teams from AppContext
  const teamsData = (supervisorTeams || []).map((team) => {
    const teamIncidents = incidents.filter(
      (i) => (i.spvTeam && i.spvTeam.includes(team.spvName)) || i.spvName === team.spvName || team.spvName === 'Ahmad Subagja'
    );

    const teamOffPjpAbsens = offPjpAttendances.filter(
      (a) => (a.spvTeam && a.spvTeam.includes(team.spvName)) || a.spvName === team.spvName || team.spvName === 'Ahmad Subagja'
    );

    const closedCount = teamIncidents.filter((i) => i.type === 'CLOSED_SHOP' || i.outletName).length;
    const directRerouteCount = teamIncidents.filter((i) => i.status === 'RESOLVED_DIRECT_REROUTE').length;
    const offPjpCount = teamIncidents.filter((i) => i.status === 'RESOLVED_OFFPJP_APPROVED' || i.type === 'OFF_PJP_REQUEST').length;
    const skipCount = teamIncidents.filter((i) => i.status === 'RESOLVED_SKIP').length;
    const approvedRerouteCount = teamIncidents.filter((i) => i.status === 'RESOLVED_REROUTE_APPROVED').length;
    const unvalidatedAbsenCount = teamOffPjpAbsens.filter((a) => a.validationStatus === 'TIDAK_TERVALIDASI').length;

    return {
      ...team,
      incidentsList: teamIncidents,
      offPjpAbsensList: teamOffPjpAbsens,
      closedCount,
      directRerouteCount,
      offPjpCount,
      skipCount,
      approvedRerouteCount,
      unvalidatedAbsenCount,
    };
  });



  return (
    <div className="space-y-6">
      {teamsData.map((team, idx) => (
        <div key={idx} className="app-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-glass pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold">
                <LuUsers className="text-xl" />
              </div>
              <div>
                <h4 className="card-title">{team.spvTeam}</h4>
                <p className="card-subtitle">
                  Supervisor: <strong className="text-on-surface">{team.spvName}</strong> • {team.cluster}
                </p>
              </div>
            </div>
            <span className="badge-base bg-surface-container-high text-on-surface-variant self-start sm:self-auto">
              Total {team.incidentsList.length} Catatan Perubahan
            </span>
          </div>

          {/* Metric Badges Summary per SPV Team */}
          <div className="grid-4 text-xs">
            <div className="bg-surface-variant/30 p-3 rounded-xl border border-border-glass flex items-center gap-2.5">
              <LuRefreshCw className="text-emerald-600 text-lg flex-shrink-0" />
              <div>
                <span className="text-[11px] text-on-surface-variant block">Reroute Langsung SPV:</span>
                <span className="font-bold text-emerald-600">{team.directRerouteCount} Kejadian</span>
              </div>
            </div>

            <div className="bg-surface-variant/30 p-3 rounded-xl border border-border-glass flex items-center gap-2.5">
              <FiPlusCircle className="text-tertiary text-lg flex-shrink-0" />
              <div>
                <span className="text-[11px] text-on-surface-variant block">Toko Luar RJP:</span>
                <span className="font-bold text-tertiary">{team.offPjpCount} Kejadian</span>
              </div>
            </div>

            <div className="bg-surface-variant/30 p-3 rounded-xl border border-border-glass flex items-center gap-2.5">
              <LuSlash className="text-amber-600 text-lg flex-shrink-0" />
              <div>
                <span className="text-[11px] text-on-surface-variant block">Skip Toko Disetujui:</span>
                <span className="font-bold text-amber-600">{team.skipCount} Kejadian</span>
              </div>
            </div>

            <div className="bg-surface-variant/30 p-3 rounded-xl border border-border-glass flex items-center gap-2.5">
              <LuUsers className="text-tertiary text-lg flex-shrink-0" />
              <div>
                <span className="text-[11px] text-on-surface-variant block">Approval Ops Manager:</span>
                <span className="font-bold text-tertiary">{team.approvedRerouteCount} Disetujui</span>
              </div>
            </div>
          </div>

          {/* Log Table of Route Changes for this Team */}
          <RouteChangesTable incidentsList={team.incidentsList} />

          {/* Log Table of Off-PJP Absen Validation for this Team */}
          <OffPjpAbsenTable offPjpAbsensList={team.offPjpAbsensList} />
        </div>
      ))}
    </div>
  );
};
