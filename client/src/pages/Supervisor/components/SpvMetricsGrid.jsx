import React from 'react';
import { LuStore, LuCircleCheck, LuClock } from 'react-icons/lu';
import { SpvKpiCard } from './SpvKpiCard';
import { SPV_MODES } from '../../../constants/supervisor';

/**
 * SpvMetricsGrid Component
 * Single Responsibility: Overview banner of 3 quick KPI metrics for SPV field visits.
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
            <SpvKpiCard
                icon={LuStore}
                label="Target Kunjungan SPV"
                value={spvStops.length}
                suffix="Outlet"
                footer={modeLabel}
            />
            <SpvKpiCard
                icon={LuCircleCheck}
                label="Supervisi Selesai"
                value={completedCount}
                suffix={`/ ${spvStops.length} Toko`}
                footer={`${realization}% Realisasi Kunjungan`}
            />
            <SpvKpiCard
                icon={LuClock}
                label="Sedang Disupervisi"
                value={inVisitCount}
                suffix="Outlet Aktif"
                footer={inVisitCount > 0 ? 'Check-In aktif berjalan' : 'Siap ke outlet berikutnya'}
            />
        </div>
    );
};
