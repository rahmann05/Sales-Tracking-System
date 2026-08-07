import React from 'react';
import { LuKey, LuCheck, LuX, LuUser, LuMapPin, LuClock } from 'react-icons/lu';

/**
 * UnlockRequestCard Component
 * Equal height standard: h-full min-h-[240px] flex flex-col justify-between
 */
export const UnlockRequestCard = ({ request, onApprove, onReject }) => {
  return (
    <div className="bg-surface border border-amber-500/30 rounded-2xl p-4 shadow-sm space-y-3 bg-amber-500/5 h-full min-h-[240px] flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 mt-0.5">
              <LuKey className="text-base" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-on-surface text-sm line-clamp-1">{request.outletName}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 uppercase">
                  {request.userRole || 'SALES'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                <LuUser className="text-xs text-primary" />
                <span>Diajukan oleh: <strong>{request.userName}</strong></span>
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-on-surface-variant flex items-center gap-1 shrink-0">
            <LuClock className="text-xs" />
            {request.requestedAt}
          </span>
        </div>

        <div className="p-3 bg-surface rounded-xl border border-border-glass text-xs space-y-1">
          <p className="text-on-surface-variant line-clamp-1">
            <LuMapPin className="text-xs inline mr-1 text-primary" />
            {request.address || 'Alamat outlet'}
          </p>
          <p className="text-on-surface line-clamp-2">
            <strong>Alasan Unlock:</strong> {request.reason}
          </p>
          {request.activeVisitingOutlet && (
            <p className="text-[11px] text-amber-700 line-clamp-1">
              Outlet aktif sebelumnya: {request.activeVisitingOutlet}
            </p>
          )}
        </div>
      </div>

      <div className="pt-2 mt-auto">
        {request.status === 'PENDING' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onApprove(request.id, request.stopId, request.userRole)}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <LuCheck className="text-sm" />
              <span>Setujui & Buka Kunci (Unlock)</span>
            </button>
            <button
              type="button"
              onClick={() => onReject(request.id)}
              className="px-3 py-2 bg-surface-variant hover:bg-rose-500/10 text-on-surface-variant hover:text-rose-600 border border-border-glass rounded-xl text-xs font-semibold transition-all"
            >
              <LuX className="text-sm" />
              <span>Tolak</span>
            </button>
          </div>
        ) : (
          <div className="text-center text-xs font-bold py-1 text-emerald-600">
            Status: {request.status === 'APPROVED' ? 'Telah Di-Unlock' : 'Ditolak'}
          </div>
        )}
      </div>
    </div>
  );
};
