import React from 'react';
import { LuCheck } from 'react-icons/lu';

/**
 * OutletListPanel — Scrollable list of outlets with checkbox toggle.
 * Used in the Create Cluster wizard for manual outlet adjustment.
 */
export const OutletListPanel = ({
  outlets = [],
  selectedIds = [],
  onToggle,
  maxHeight = '300px',
  disabled = false,
}) => {
  return (
    <div
      className="border border-slate-200 rounded-xl overflow-y-auto bg-white"
      style={{ maxHeight }}
    >
      {outlets.length === 0 && (
        <div className="p-4 text-sm text-slate-500 text-center">
          Tidak ada outlet yang sesuai dengan pencarian atau akses wilayah Anda.
        </div>
      )}
      {outlets.map((outlet) => {
        const isSelected = selectedIds.includes(outlet.id);
        const isUnassigned = !outlet.clusterId || outlet.cluster?.name === 'Belum Ditugaskan';
        return (
          <button
            key={outlet.id}
            type="button"
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => onToggle(outlet.id)}
            className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 text-left border-b border-slate-100 last:border-b-0 transition-colors ${
              isSelected ? 'bg-[#f0f6ff]' : 'hover:bg-slate-50'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                isSelected
                  ? 'bg-[#1b66ca] border-[#1b66ca] text-white'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {isSelected && <LuCheck className="text-xs" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#01144c] min-w-0 whitespace-normal break-words">
                {outlet.name}
              </p>
              <p className="text-xs text-slate-500 min-w-0 whitespace-normal break-words">
                {outlet.address || outlet.outletCode || ''}
              </p>
            </div>
            {isUnassigned ? (
              <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                Belum berwilayah
              </span>
            ) : (
              <span className="text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                Dari: {outlet.cluster?.name || 'Sudah berwilayah'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
