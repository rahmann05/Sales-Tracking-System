import React from 'react';
import { LuCheck, LuX, LuArrowRight } from 'react-icons/lu';

/**
 * RerouteApprovalInbox Component (Single Responsibility: Inbox for Operational Manager to Approve SPV Reroute Requests)
 * 1 File per Component
 */
export const RerouteApprovalInbox = ({ pendingReroutes, onDecision }) => {
  if (pendingReroutes.length === 0) {
    return (
      <div className="p-6 text-center bg-surface border border-border-glass rounded-2xl text-on-surface-variant text-xs font-medium">
        Tidak ada permohonan reroute dari Supervisor yang membutuhkan approval Manajer Operasional saat ini.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingReroutes.map((item) => (
        <div key={item.id} className="bg-surface border border-purple-500/30 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 uppercase">
                Permohonan Reroute PJP
              </span>
              <h4 className="font-bold text-on-surface text-base mt-1 flex items-center gap-2">
                <span>{item.outletName}</span>
                <LuArrowRight className="text-purple-600 text-sm" />
                <span className="text-purple-700">{item.newOutletName}</span>
              </h4>
              <p className="text-xs text-on-surface-variant">
                Diajukan oleh SPV: <span className="font-semibold text-on-surface">Ahmad Subagja</span> • Alasan: {item.rerouteReason}
              </p>
            </div>

            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600">
              PENDING APPROVAL
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border-glass">
            <button
              type="button"
              onClick={() => onDecision({ incidentId: item.id, approved: true })}
              className="flex-1 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <LuCheck className="text-base" />
              <span>Approve & Update Rute Sales Live</span>
            </button>

            <button
              type="button"
              onClick={() => onDecision({ incidentId: item.id, approved: false })}
              className="px-4 py-2.5 bg-rose-500/10 text-rose-600 border border-rose-500/30 font-bold text-xs rounded-xl hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <LuX className="text-base" />
              <span>Reject Permohonan</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
