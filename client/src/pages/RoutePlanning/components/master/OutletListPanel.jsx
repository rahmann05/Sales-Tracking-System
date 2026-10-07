import React from 'react';
import { LuCheck } from 'react-icons/lu';

/**
 * OutletListPanel — Scrollable list of outlets with checkbox toggle.
 * Used in the Create Cluster wizard for manual outlet adjustment.
 */
export const OutletListPanel = ({ outlets = [], selectedIds = [], onToggle, maxHeight = '300px', disabled = false }) => {
    return (
        <div
            className="border border-gray-200 rounded-lg overflow-y-auto bg-white"
            style={{ maxHeight }}
        >
            {outlets.length === 0 && (
                <div className="p-4 text-sm text-gray-400 text-center">
                    Tidak ada outlet yang sesuai dengan pencarian atau akses wilayah Anda.
                </div>
            )}
            {outlets.map((outlet) => {
                const isSelected = selectedIds.includes(outlet.id);
                return (
                    <button
                        key={outlet.id}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={disabled}
                        onClick={() => onToggle(outlet.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-gray-100 last:border-b-0 transition-colors ${isSelected ? 'bg-neutral-100' : 'hover:bg-gray-50'
                            }`}
                    >
                        <div
                            className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected
                                    ? 'bg-neutral-900 border-neutral-900 text-white'
                                    : 'border-gray-300 bg-white'
                                }`}
                        >
                            {isSelected && <LuCheck className="text-xs" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 min-w-0 whitespace-normal break-words">
                                {outlet.name}
                            </p>
                            <p className="text-xs text-gray-500 min-w-0 whitespace-normal break-words">
                                {outlet.address || outlet.outletCode || ''}
                            </p>
                        </div>
                        {outlet.clusterId && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0">
                                Sudah berwilayah
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
