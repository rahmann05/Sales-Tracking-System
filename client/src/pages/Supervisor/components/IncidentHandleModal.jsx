import React, { useState } from 'react';
import { LuArrowRight } from 'react-icons/lu';
import { FiXCircle, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

/**
 * IncidentHandleModal Component (Single Responsibility: SPV Decision Modal for Skip vs Reroute Request)
 * 1 File per Component
 */
export const IncidentHandleModal = ({ incident, onClose, onSkip, onRequestReroute }) => {
  const [actionType, setActionType] = useState('SKIP'); // 'SKIP' or 'REROUTE'
  const [replacementOutletName, setReplacementOutletName] = useState('Toko Sumber Berkah (Cluster Roxy)');
  const [rerouteReason, setRerouteReason] = useState('Penggantian toko dalam cluster yang sama untuk menjaga kuota pjp');

  if (!incident) return null;

  const handleSubmit = () => {
    if (actionType === 'SKIP') {
      onSkip(incident.id);
    } else {
      onRequestReroute({
        incidentId: incident.id,
        newOutletName: replacementOutletName,
        reason: rerouteReason,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border-glass rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-glass pb-3">
          <div>
            <h3 className="font-bold text-lg text-on-surface">Keputusan Supervisor (SPV)</h3>
            <p className="text-xs text-on-surface-variant">Laporan Toko Tutup: {incident.outletName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant">
            <FiXCircle className="text-xl" />
          </button>
        </div>

        {/* Action Type Selection Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActionType('SKIP')}
            className={`p-3.5 rounded-2xl border text-left transition-all space-y-1 ${
              actionType === 'SKIP'
                ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                : 'border-border-glass bg-surface/40 hover:bg-surface'
            }`}
          >
            <p className="font-bold text-xs text-on-surface">Opsi 1: Lewati (Skip)</p>
            <p className="text-[11px] text-on-surface-variant">
              Toko dilewati. Manajer Operasional <strong>hanya menerima notifikasi info</strong>.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActionType('REROUTE')}
            className={`p-3.5 rounded-2xl border text-left transition-all space-y-1 ${
              actionType === 'REROUTE'
                ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30'
                : 'border-border-glass bg-surface/40 hover:bg-surface'
            }`}
          >
            <p className="font-bold text-xs text-on-surface">Opsi 2: Ubah Rute</p>
            <p className="text-[11px] text-on-surface-variant">
              Ganti toko pengganti. <strong>Perlu persetujuan Manajer Operasional</strong>.
            </p>
          </button>
        </div>

        {/* Reroute Options if REROUTE selected */}
        {actionType === 'REROUTE' && (
          <div className="space-y-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface">Toko Pengganti (Cluster Sama):</label>
              <input
                type="text"
                value={replacementOutletName}
                onChange={(e) => setReplacementOutletName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-xs font-semibold text-on-surface"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface">Catatan Reroute SPV:</label>
              <textarea
                value={rerouteReason}
                onChange={(e) => setRerouteReason(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl border border-border-glass bg-surface text-xs text-on-surface"
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
            actionType === 'SKIP' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          <span>{actionType === 'SKIP' ? 'Konfirmasi Skip Toko' : 'Kirim Permohonan Reroute ke Manajer'}</span>
          <LuArrowRight className="text-base" />
        </button>
      </div>
    </div>
  );
};
