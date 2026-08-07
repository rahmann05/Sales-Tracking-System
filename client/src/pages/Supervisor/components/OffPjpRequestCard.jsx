import React from 'react';
import { LuClock, LuMapPin, LuUser, LuCheck, LuX } from 'react-icons/lu';

/**
 * OffPjpRequestCard Component
 * Single Responsibility: Display and approve off-PJP visit request in a full-width 1-row layout.
 */
export const OffPjpRequestCard = ({ req, onApprove }) => {
  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-all w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left Details */}
      <div className="space-y-2 flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-secondary/10 text-secondary uppercase tracking-wider">
            Pengajuan Toko Luar RJP
          </span>
          <span className="text-xs font-mono text-on-surface-variant flex items-center gap-1">
            <LuClock className="text-xs text-primary" />
            {req.reportedAt}
          </span>
        </div>

        <div>
          <h4 className="font-bold text-on-surface text-base tracking-tight">{req.outletName}</h4>
          <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
            <LuMapPin className="text-primary text-xs shrink-0" />
            <span>{req.address}</span>
          </p>
        </div>

        <div className="text-xs text-on-surface bg-surface-variant/25 px-3 py-1.5 rounded-xl border border-border-glass inline-flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 font-semibold text-primary">
            <LuUser className="text-xs" />
            Sales: {req.salesName}
          </span>
          <span className="text-on-surface-variant">•</span>
          <span className="text-on-surface-variant">Alasan: "{req.reason}"</span>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border-glass">
        <button
          onClick={() => onApprove({ requestId: req.id, approved: true })}
          className="px-5 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5"
        >
          <LuCheck className="text-base" />
          <span>Setujui & Tambah ke RJP</span>
        </button>
        <button
          onClick={() => onApprove({ requestId: req.id, approved: false })}
          className="px-4 py-2.5 bg-rose-500/10 text-rose-600 border border-rose-500/30 font-bold text-xs rounded-xl hover:bg-rose-500/20 transition-all flex items-center gap-1"
        >
          <LuX className="text-base" />
          <span>Tolak</span>
        </button>
      </div>
    </div>
  );
};
