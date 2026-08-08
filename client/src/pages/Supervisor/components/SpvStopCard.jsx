import React from 'react';
import { LuCheck, LuUser, LuNavigation, LuMapPin, LuCircleCheck, LuCamera, LuFileText } from 'react-icons/lu';

/**
 * SpvStopCard Component
 * Single Responsibility: Render satu kartu titik kunjungan supervisi
 * (info outlet + status + aksi absen/audit) sesuai status visit record.
 */
export const SpvStopCard = ({ stop, index, record, onAbsenIn, onOpenAudit, onAbsenOut }) => {
    const isCompleted = record.status === 'COMPLETED';
    const isInVisit = record.status === 'IN_VISIT';

    const containerClass = isCompleted
        ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
        : isInVisit
            ? 'border-primary/50 shadow-md ring-1 ring-primary/30'
            : 'border-border-glass hover:border-primary/30';

    const badgeClass = isCompleted
        ? 'bg-emerald-500 text-white'
        : isInVisit
            ? 'bg-primary text-on-primary animate-pulse'
            : 'bg-surface-variant text-on-surface-variant';

    return (
        <div className={`bg-surface border rounded-3xl p-5 md:p-6 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${containerClass}`}>
            <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shrink-0 ${badgeClass}`}>
                    {isCompleted ? <LuCheck className="text-xl" /> : `#${index + 1}`}
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {stop.spvVisitType}
                        </span>
                        <span className="text-xs text-on-surface-variant flex items-center gap-1">
                            <LuUser className="text-xs text-primary" />
                            Sales: <strong className="text-on-surface font-semibold">{stop.assignedSales}</strong>
                        </span>
                        <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${stop.currentDistance <= stop.radiusMeters
                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                }`}
                        >
                            <LuNavigation className="text-[10px]" />
                            {stop.currentDistance}m dari Toko (Radius {stop.radiusMeters}m)
                        </span>
                    </div>

                    <h5 className="font-bold text-on-surface text-lg tracking-tight">{stop.outletName}</h5>

                    <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                        <LuMapPin className="text-primary text-xs shrink-0" />
                        <span>{stop.address} • Pemilik: <strong className="text-on-surface">{stop.owner}</strong> ({stop.phone})</span>
                    </p>

                    {isCompleted && record.notes && (
                        <div className="text-xs text-emerald-800 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 mt-2 space-y-1">
                            <div className="flex items-center justify-between font-bold">
                                <span className="flex items-center gap-1.5">
                                    <LuCircleCheck className="text-emerald-600 text-sm" />
                                    Laporan Supervisi SPV:
                                </span>
                                <span className="text-[11px] font-mono text-emerald-700">
                                    Masuk: {record.checkInTime} • Selesai: {record.checkOutTime}
                                </span>
                            </div>
                            <p className="text-[11px] leading-relaxed">{record.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border-glass">
                {record.status === 'PENDING' && (
                    <button
                        type="button"
                        onClick={() => onAbsenIn(stop)}
                        className="px-5 py-3 bg-primary text-on-primary font-bold text-xs rounded-2xl hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                        <LuCamera className="text-base" />
                        <span>Absen Masuk (Clock In)</span>
                    </button>
                )}

                {isInVisit && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onOpenAudit(stop)}
                            className="px-4 py-3 bg-surface-variant text-on-surface font-bold text-xs rounded-2xl hover:bg-surface-variant/80 transition-all border border-border-glass flex items-center gap-2 cursor-pointer"
                        >
                            <LuFileText className="text-base text-primary" />
                            <span>Form Audit & Checklist</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onAbsenOut(stop)}
                            className="px-5 py-3 bg-emerald-600 text-white font-bold text-xs rounded-2xl hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                            <LuCheck className="text-base" />
                            <span>Absen Keluar (Selesai)</span>
                        </button>
                    </div>
                )}

                {isCompleted && (
                    <span className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-2">
                        <LuCircleCheck className="text-base" />
                        <span>Supervisi Selesai</span>
                    </span>
                )}
            </div>
        </div>
    );
};
