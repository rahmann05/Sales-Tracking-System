import React from 'react';

export const DecisionOptionCards = ({ actionType, onSelectAction }) => {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      <button
        type="button"
        onClick={() => onSelectAction('SKIP')}
        className={`p-3 rounded-2xl border text-left transition-all space-y-1 ${
          actionType === 'SKIP'
            ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
            : 'border-border-glass bg-surface/40 hover:bg-surface'
        }`}
      >
        <p className="font-bold text-xs text-on-surface">Opsi 1: Lewati (Skip)</p>
        <p className="text-[10px] text-on-surface-variant leading-tight">
          Toko dilewati & dicatat di laporan audit.
        </p>
      </button>

      <button
        type="button"
        onClick={() => onSelectAction('DIRECT_REROUTE')}
        className={`p-3 rounded-2xl border text-left transition-all space-y-1 ${
          actionType === 'DIRECT_REROUTE'
            ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
            : 'border-border-glass bg-surface/40 hover:bg-surface'
        }`}
      >
        <p className="font-bold text-xs text-on-surface">Opsi 2: Reroute Langsung</p>
        <p className="text-[10px] text-on-surface-variant leading-tight">
          Ganti toko rute sales langsung (Wewenang SPV).
        </p>
      </button>

      <button
        type="button"
        onClick={() => onSelectAction('REROUTE')}
        className={`p-3 rounded-2xl border text-left transition-all space-y-1 ${
          actionType === 'REROUTE'
            ? 'border-tertiary bg-tertiary/10 ring-2 ring-tertiary/30'
            : 'border-border-glass bg-surface/40 hover:bg-surface'
        }`}
      >
        <p className="font-bold text-xs text-on-surface">Opsi 3: Ajukan Ops</p>
        <p className="text-[10px] text-on-surface-variant leading-tight">
          Pengajuan reroute dengan persetujuan Manajer.
        </p>
      </button>
    </div>
  );
};
