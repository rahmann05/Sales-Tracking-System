import React from 'react';
import { LuClock } from 'react-icons/lu';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

/**
 * IncidentCard Component (Single Responsibility: Individual Closed Outlet Incident Row for SPV)
 * 1 File per Component
 */
export const IncidentCard = ({ incident, onHandleIncident }) => {
  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 uppercase">
            {incident.reason}
          </span>
          <h4 className="font-bold text-on-surface text-base mt-1">{incident.outletName}</h4>
          <p className="text-xs text-on-surface-variant">
            Dilaporkan oleh Sales: <span className="font-semibold text-on-surface">{incident.salesName}</span> ({incident.reportedAt})
          </p>
        </div>

        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            incident.status === 'PENDING_SPV'
              ? 'bg-amber-500/10 text-amber-600'
              : incident.status === 'RESOLVED_SKIP'
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-blue-500/10 text-blue-600'
          }`}
        >
          {incident.status}
        </span>
      </div>

      {/* Photo Proof */}
      <div className="relative rounded-xl overflow-hidden aspect-video border border-border-glass max-h-36">
        <img src={incident.photoUrl} alt="Bukti Tutup" className="w-full h-full object-cover" />
      </div>

      {incident.status === 'PENDING_SPV' ? (
        <button
          type="button"
          onClick={() => onHandleIncident(incident)}
          className="w-full py-2.5 bg-purple-600 text-white font-semibold text-xs rounded-xl hover:bg-purple-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <FiAlertCircle className="text-base" />
          <span>Ambil Keputusan SPV (Skip vs Reroute)</span>
        </button>
      ) : (
        <div className="text-xs text-on-surface-variant italic bg-surface-variant/30 p-2 rounded-xl text-center">
          {incident.status === 'RESOLVED_SKIP'
            ? 'Instruksi Skip disetujui SPV (Manajer Operasional Ter-notifikasi)'
            : `Reroute diajukan ke Manajer Operasional (${incident.newOutletName || 'Toko Pengganti'})`}
        </div>
      )}
    </div>
  );
};
