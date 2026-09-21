import React from 'react';
import { LuClock, LuUser, LuMapPin } from 'react-icons/lu';
import { FiAlertCircle } from 'react-icons/fi';

/**
 * IncidentCard Component
 * Single Responsibility: Symmetrical, Apple-Editorial closed outlet incident row for Supervisor.
 */
export const IncidentCard = ({ incident, onHandleIncident }) => {
  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-4 sm:p-5 shadow-xs hover:border-border-glass/80 transition-all w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Thumbnail & Info */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {/* Photo Proof */}
        {incident.photoUrl && (
          <div className="relative rounded-xl overflow-hidden aspect-video border border-border-glass w-24 sm:w-32 shrink-0 bg-surface-container shadow-inner">
            <img src={incident.photoUrl} alt="Bukti Tutup" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface border border-border-glass uppercase tracking-wider">
              {incident.reason || 'KENDALA TOKO'}
            </span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                incident.status === 'PENDING_SPV'
                  ? 'bg-amber-50 text-amber-800 border-amber-200/60'
                  : incident.status === 'RESOLVED_SKIP'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                  : 'bg-surface-container text-on-surface border-border-glass'
              }`}
            >
              {incident.status === 'PENDING_SPV' ? 'Menunggu Keputusan' : incident.status}
            </span>
            <span className="text-xs font-mono text-on-surface-variant flex items-center gap-1">
              <LuClock className="text-xs text-on-surface-variant" />
              {incident.reportedAt}
            </span>
          </div>

          <h4 className="font-bold text-on-surface text-sm sm:text-base tracking-tight m-0">{incident.outletName}</h4>
          <p className="text-xs text-on-surface-variant flex items-center gap-1 m-0">
            <LuMapPin className="text-on-surface-variant text-xs shrink-0" />
            <span className="truncate">{incident.address || 'Bandung Barat'}</span>
          </p>

          <p className="text-xs text-on-surface flex items-center gap-1.5 m-0 pt-0.5">
            <LuUser className="text-xs text-on-surface-variant shrink-0" />
            <span>Dilaporkan oleh: <strong className="font-semibold">{incident.salesName}</strong></span>
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border-glass">
        {incident.status === 'PENDING_SPV' ? (
          <button
            type="button"
            onClick={() => onHandleIncident(incident)}
            className="w-full sm:w-auto px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <FiAlertCircle className="text-sm shrink-0" />
            <span>Ambil Keputusan (Skip vs Reroute)</span>
          </button>
        ) : (
          <div className="text-xs text-on-surface-variant bg-surface-container/60 px-3.5 py-2 rounded-xl text-center border border-border-glass">
            {incident.status === 'RESOLVED_SKIP'
              ? 'Instruksi Skip disetujui SPV'
              : `Reroute disetujui SPV (${incident.newOutletName || 'Toko Pengganti'})`}
          </div>
        )}
      </div>
    </div>
  );
};
