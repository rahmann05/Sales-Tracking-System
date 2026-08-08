import React from 'react';
import { LuMapPin } from 'react-icons/lu';
import { Avatar } from '../../../components/common/Avatar';

/**
 * SalesRepProgressCard Component
 * Single Responsibility: Render progress kunjungan harian satu sales rep (avatar, progress bar, status counts).
 */
export const SalesRepProgressCard = ({ rep }) => (
    <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Avatar name={rep.name} size="md" className="rounded-xl ring-1 ring-primary/20" />
                <div>
                    <h5 className="font-bold text-on-surface text-sm">{rep.name}</h5>
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                        <LuMapPin className="text-[10px] text-primary" />
                        {rep.cluster}
                    </span>
                </div>
            </div>
            <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                {rep.progress}%
            </span>
        </div>

        <div className="space-y-1.5 pt-1">
            <div className="w-full h-2 bg-surface-variant/40 rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(rep.progress, 100)}%` }}
                />
            </div>
            <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                <span className="text-emerald-600 font-semibold">{rep.completed} Selesai</span>
                {rep.inVisit > 0 && (
                    <span className="text-blue-600 font-semibold">{rep.inVisit} Sedang Kunjung</span>
                )}
                {rep.closed > 0 && (
                    <span className="text-rose-600 font-semibold">{rep.closed} Tutup</span>
                )}
                <span>Target: {rep.total} Toko</span>
            </div>
        </div>
    </div>
);
