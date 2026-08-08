import React from 'react';
import { LuTrendingUp, LuCompass, LuStore, LuCircleCheck } from 'react-icons/lu';

const KpiTile = ({ icon: Icon, iconClass, label, value, suffix, footer, footerClass = 'text-on-surface-variant' }) => (
    <div className="p-4 bg-surface-variant/20 rounded-2xl border border-border-glass space-y-1">
        <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
            <Icon className={`${iconClass} text-xs`} /> {label}
        </span>
        <div className="text-2xl font-black text-on-surface">
            {value} {suffix && <span className="text-xs font-normal text-on-surface-variant">{suffix}</span>}
        </div>
        <div className={`text-[10px] ${footerClass}`}>{footer}</div>
    </div>
);

const VERDICT_STYLES = {
    EXCELLENT: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    MITIGATED: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
    HIGH_DEVIATION: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
};

/**
 * ComplianceKpiCards Component
 * Single Responsibility: Header + 4 KPI analitik kepatuhan RJP tim sales.
 */
export const ComplianceKpiCards = ({ metrics }) => {
    const verdictClass = VERDICT_STYLES[metrics.complianceCategory] || 'bg-surface-variant text-on-surface-variant';

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-glass pb-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                            <LuTrendingUp />
                        </span>
                        <h3 className="text-lg font-black text-on-surface tracking-tight">
                            Progres Kunjungan Tim Sales (Hari Ini)
                        </h3>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                        Monitoring pemenuhan target kunjungan toko per sales dan rasio kepatuhan rute RJP terencana.
                    </p>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 self-start sm:self-auto ${verdictClass}`}>
                    {metrics.complianceVerdict}
                </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <KpiTile
                    icon={LuStore}
                    iconClass="text-primary"
                    label="Kunjungan Sesuai RJP"
                    value={metrics.rjpCompleted}
                    suffix={`/ ${metrics.rjpTotal} Toko`}
                    footer="Disiplin Rute RJP"
                    footerClass="text-emerald-600 font-semibold flex items-center gap-1"
                />
                <KpiTile
                    icon={LuCompass}
                    iconClass="text-tertiary"
                    label="Absen di Luar RJP"
                    value={metrics.offPjpTotal}
                    suffix="Kunjungan"
                    footer={`${metrics.offPjpValidated} Sah • ${metrics.offPjpPending} Menunggu SPV`}
                />
                <KpiTile
                    icon={LuCompass}
                    iconClass="text-primary"
                    label="Kepatuhan Rute RJP"
                    value={`${metrics.rjpAdherenceRate}%`}
                    footer={`${metrics.offPjpDeviationRate}% Deviasi Luar Rute`}
                />
                <KpiTile
                    icon={LuTrendingUp}
                    iconClass="text-primary"
                    label="Total Kunjungan Tim"
                    value={metrics.totalValidVisits}
                    suffix="Toko"
                    footer="3 Tim Sales Aktif Hari Ini"
                    footerClass="font-semibold text-emerald-600"
                />
            </div>
        </>
    );
};
