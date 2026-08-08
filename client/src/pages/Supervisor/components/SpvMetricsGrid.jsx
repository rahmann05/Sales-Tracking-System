import React from 'react';
import { LuStore, LuCircleCheck, LuClock, LuNavigation } from 'react-icons/lu';
import { SpvKpiCard } from './SpvKpiCard';
import { SPV_MODES } from '../../../constants/supervisor';

/**
 * SpvMetricsGrid Component
 * Single Responsibility: Overview banner of 4 quick KPI metrics for SPV field visits.
 */
export const SpvMetricsGrid = ({ spvStops, spvMode, selectedSales, completedCount, inVisitCount }) => {
    const modeLabel =
        spvMode === SPV_MODES.JOINT_VISIT
            ? `Joint Visit: ${selectedSales}`
            : spvMode === SPV_MODES.PRIORITY_AUDIT
                ? 'Audit Toko Prioritas'
                : 'Inspeksi Pembuka';

    const realization = spvStops.length > 0 ? Math.round((completedCount / spvStops.length) * 100) : 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <SpvKpiCard
                icon={LuStore}
                label="Target Kunjungan SPV"
                value={spvStops.length}
                suffix="Outlet Hari Ini"
                footer={modeLabel}
            />
            <SpvKpiCard
                icon={LuCircleCheck}
                iconClass="text-emerald-600"
                valueClass="text-emerald-600"
                label="Supervisi Selesai"
                value={completedCount}
                suffix={`/ ${spvStops.length} Toko`}
                footer={`${realization}% Realisasi Kunjungan`}
            />
            <SpvKpiCard
                icon={LuClock}
                iconClass="text-blue-600"
                valueClass="text-blue-600"
                label="Sedang Disupervisi"
                value={inVisitCount}
                suffix="Outlet Aktif"
                footer={inVisitCount > 0 ? 'Check-In aktif berjalan' : 'Siap ke outlet berikutnya'}
            />
            <div className="p-4 bg-surface rounded-2xl border border-border-glass shadow-sm space-y-1">
                <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
                    <LuNavigation className="text-primary text-xs" /> Status GPS Lapangan
                </span>
                <div className="text-base font-black text-emerald-600 flex items-center gap-1 pt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    <span>GPS Akurat (±15m)</span>
                </div>
                <div className="text-[10px] text-on-surface-variant">Valid untuk Presensi & Audit Toko</div>
            </div>
        </div>
    );
};
