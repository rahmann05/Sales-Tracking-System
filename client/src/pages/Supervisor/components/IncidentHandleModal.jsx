import React, { useState } from 'react';
import { LuArrowRight } from 'react-icons/lu';
import { FiXCircle, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { DecisionOptionCards } from './DecisionOptionCards';

/**
 * IncidentHandleModal Component (Single Responsibility: SPV Decision Modal for Skip vs Reroute Request)
 * 1 File per Component
 */
export const IncidentHandleModal = ({ incident, onClose, onSkip, onDirectReroute, onRequestReroute }) => {
  const [actionType, setActionType] = useState('SKIP'); // 'SKIP', 'DIRECT_REROUTE', or 'REROUTE'
  const [replacementOutletName, setReplacementOutletName] = useState('Toko Sumber Berkah Cimahi');
  const [replacementAddress, setReplacementAddress] = useState('Jl. Raya Amir Machmud No. 88, Cimahi');
  const [rerouteReason, setRerouteReason] = useState('Penggantian toko rute langsung oleh Supervisor');

  if (!incident) return null;

  const handleSubmit = () => {
    if (actionType === 'SKIP') {
      onSkip(incident.id);
    } else if (actionType === 'DIRECT_REROUTE') {
      onDirectReroute({
        incidentId: incident.id,
        newOutletName: replacementOutletName,
        address: replacementAddress,
        reason: rerouteReason,
      });
    } else {
      onRequestReroute({
        incidentId: incident.id,
        newOutletName: replacementOutletName,
        reason: rerouteReason,
      });
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-lg space-y-5">
        <div className="modal-header">
          <div>
            <h3 className="section-title">Keputusan Supervisor (SPV)</h3>
            <p className="card-subtitle">Laporan Toko Tutup: {incident.outletName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant">
            <FiXCircle className="text-xl" />
          </button>
        </div>

        {/* Action Type Selection Cards */}
        <DecisionOptionCards actionType={actionType} onSelectAction={setActionType} />

        {/* Reroute Options if DIRECT_REROUTE or REROUTE selected */}
        {(actionType === 'DIRECT_REROUTE' || actionType === 'REROUTE') && (
          <div className="space-y-3 p-3 bg-tertiary/5 border border-tertiary/20 rounded-2xl">
            <div className="space-y-1">
              <label className="form-label">Toko Pengganti (Cluster Cimahi - KBB):</label>
              <input
                type="text"
                value={replacementOutletName}
                onChange={(e) => setReplacementOutletName(e.target.value)}
                className="form-input"
              />
            </div>
            {actionType === 'DIRECT_REROUTE' && (
              <div className="space-y-1">
                <label className="form-label">Alamat Toko Pengganti:</label>
                <input
                  type="text"
                  value={replacementAddress}
                  onChange={(e) => setReplacementAddress(e.target.value)}
                  className="form-input"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="form-label">Catatan Reroute SPV:</label>
              <textarea
                value={rerouteReason}
                onChange={(e) => setRerouteReason(e.target.value)}
                placeholder="Opsional, panduan untuk sales..."
                className="form-input"
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
            actionType === 'SKIP'
              ? 'bg-amber-600 hover:bg-amber-700'
              : actionType === 'DIRECT_REROUTE'
              ? 'bg-primary hover:bg-primary/90'
              : 'bg-tertiary hover:bg-tertiary/90'
          }`}
        >
          <span>
            {actionType === 'SKIP'
              ? 'Konfirmasi Skip Toko'
              : actionType === 'DIRECT_REROUTE'
              ? 'Terapkan Reroute Langsung Ke Sales'
              : 'Kirim Permohonan Reroute ke Manajer'}
          </span>
          <LuArrowRight className="text-base" />
        </button>
      </div>
    </div>
  );
};
