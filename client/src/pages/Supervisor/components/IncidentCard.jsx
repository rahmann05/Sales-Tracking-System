import React from 'react';
import { LuClock, LuUser, LuMapPin } from 'react-icons/lu';
import { FiAlertCircle } from 'react-icons/fi';

/**
 * IncidentCard Component
 * Single Responsibility: Individual Closed Outlet Incident Row for SPV in a full-width 1-row layout.
 */
export const IncidentCard = ({ incident, onHandleIncident }) => {
  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-all w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Thumbnail & Info */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {/* Photo Proof */}
        {incident.photoUrl && (
          <div className="relative rounded-xl overflow-hidden aspect-video border border-border-glass w-28 md:w-36 shrink-0 bg-surface-variant/40 shadow-inner">
            <img src={incident.photoUrl} alt="Bukti Tutup" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 uppercase">
              {incident.reason}
            </span>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                incident.status === 'PENDING_SPV'
                  ? 'bg-amber-500/10 text-amber-600'
                  : incident.status === 'RESOLVED_SKIP'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-blue-500/10 text-blue-600'
              }`}
            >
              {incident.status}
            </span>
            <span className="text-xs font-mono text-on-surface-variant flex items-center gap-1">
              <LuClock className="text-xs text-primary" />
              {incident.reportedAt}
            </span>
          </div>

          <h4 className="font-bold text-on-surface text-base tracking-tight">{incident.outletName}</h4>
          <p className="text-xs text-on-surface-variant flex items-center gap-1">
            <LuMapPin className="text-primary text-xs shrink-0" />
            <span>{incident.address || 'Bandung Barat'}</span>
          </p>

          <p className="text-xs text-on-surface flex items-center gap-1.5 pt-0.5">
            <LuUser className="text-xs text-primary shrink-0" />
            <span>Dilaporkan oleh Sales: <strong className="font-semibold">{incident.salesName}</strong></span>
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border-glass">
        {incident.status === 'PENDING_SPV' ? (
          <button
            type="button"
            onClick={() => onHandleIncident(incident)}
            className="px-5 py-2.5 bg-primary text-on-primary font-semibold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <FiAlertCircle className="text-base" />
            <span>Ambil Keputusan SPV (Skip vs Reroute)</span>
          </button>
        ) : (
          <div className="text-xs text-on-surface-variant italic bg-surface-variant/30 px-3 py-2 rounded-xl text-center border border-border-glass">
            {incident.status === 'RESOLVED_SKIP'
              ? 'Instruksi Skip disetujui SPV (Manajer Ter-notifikasi)'
              : `Reroute diajukan (${incident.newOutletName || 'Toko Pengganti'})`}
          </div>
        )}
      </div>
    </div>
  );
};
