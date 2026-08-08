import React from 'react';
import { LuClock } from 'react-icons/lu';

/**
 * AdherenceGauge Component
 * Single Responsibility: Visual gauge distribusi kunjungan RJP vs luar RJP.
 */
export const AdherenceGauge = ({ metrics }) => (
    <div className="space-y-2 p-4 bg-surface-variant/15 rounded-2xl border border-border-glass">
        <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-on-surface">Distribusi Kunjungan Lapangan:</span>
            <span className="text-on-surface-variant font-mono text-[11px]">
                Total {metrics.totalAttemptedVisits} Aktivitas Kunjungan
            </span>
        </div>

        <div className="h-3 w-full bg-surface-variant/40 rounded-full overflow-hidden flex">
            <div
                style={{ width: `${metrics.rjpAdherenceRate}%` }}
                className="bg-primary h-full transition-all"
                title={`Kunjungan Murni RJP: ${metrics.rjpAdherenceRate}%`}
            />
            <div
                style={{ width: `${metrics.offPjpDeviationRate}%` }}
                className="bg-tertiary h-full transition-all"
                title={`Deviasi Luar RJP: ${metrics.offPjpDeviationRate}%`}
            />
        </div>

        <div className="flex items-center justify-between text-[11px] text-on-surface-variant flex-wrap gap-2 pt-0.5">
            <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                    <span>Kunjungan RJP Terencana ({metrics.rjpAdherenceRate}%)</span>
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-tertiary inline-block" />
                    <span>Kunjungan Luar RJP ({metrics.offPjpDeviationRate}%)</span>
                </span>
            </div>

            {metrics.offPjpPending > 0 && (
                <span className="text-blue-600 font-semibold flex items-center gap-1">
                    <LuClock className="text-xs" />
                    Ada {metrics.offPjpPending} absen luar RJP menunggu validasi Anda.
                </span>
            )}
        </div>
    </div>
);
