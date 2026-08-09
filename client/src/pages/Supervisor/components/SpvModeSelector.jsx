import React from 'react';
import { LuCompass, LuPlus } from 'react-icons/lu';
import { SPV_MODES, SPV_MODE_OPTIONS } from '../../../constants/supervisor';

/**
 * SpvModeSelector Component
 * Single Responsibility: Mode bar untuk penentuan agenda kunjungan supervisi
 * (Joint Visit / Audit Prioritas / Inspeksi Pembuka) + tombol kunjungan luar RJP.
 */
export const SpvModeSelector = ({ spvMode, onSelectMode, selectedSales, onSelectSales, salesOptions = [], onOpenOffPjp }) => (
    <div className="bg-surface border border-border-glass rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-glass pb-4">
            <div>
                <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                        <LuCompass />
                    </span>
                    <h3 className="text-lg font-black text-on-surface tracking-tight">
                        Penentuan Agenda Kunjungan Supervisi Hari Ini
                    </h3>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                    Pilih mode penentuan outlet kunjungan: Pendampingan Sales di lapangan, Audit Toko Prioritas, atau Kunjungan Pembuka Pagi.
                </p>
            </div>

            <button
                type="button"
                onClick={onOpenOffPjp}
                className="px-4 py-2.5 bg-surface-variant hover:bg-surface-variant/80 text-on-surface border border-border-glass rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start md:self-auto"
            >
                <LuPlus className="text-primary text-sm" />
                <span>+ Kunjungan Luar RJP (Dadakan)</span>
            </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {SPV_MODE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isActive = spvMode === option.id;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => onSelectMode(option.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${isActive
                                    ? 'bg-primary text-on-primary shadow-sm'
                                    : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50'
                                }`}
                        >
                            <Icon className="text-xs" />
                            <span>{option.label}</span>
                        </button>
                    );
                })}
            </div>

            {spvMode === SPV_MODES.JOINT_VISIT && (
                <div className="flex items-center gap-2 bg-surface-variant/30 px-3 py-1.5 rounded-xl border border-border-glass">
                    <span className="text-xs font-medium text-on-surface-variant">Dampingi Sales:</span>
                    <select
                        value={selectedSales}
                        onChange={(e) => onSelectSales(e.target.value)}
                        className="bg-transparent text-xs font-bold text-on-surface border-none outline-none cursor-pointer"
                    >
                        {salesOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    </div>
);
