import React from 'react';
import { LuStore, LuChevronRight } from 'react-icons/lu';

/**
 * MobileMatrixSalesCard Component
 * Single Responsibility: Kartu jadwal rolling mingguan satu sales untuk tampilan mobile.
 */
export const MobileMatrixSalesCard = ({ row, days, onCellClick }) => {
    const totalWeeklyVisits = days.reduce((acc, day) => acc + (row.schedule?.[day]?.outletsCount || 0), 0);

    return (
        <div className="bg-surface border border-border-glass rounded-2xl p-3.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-border-glass pb-2.5">
                <div>
                    <h4 className="font-extrabold text-sm text-on-surface">{row.salesName}</h4>
                    <p className="text-xs text-on-surface-variant">{row.primaryCluster}</p>
                </div>
                <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-extrabold flex items-center gap-1">
                    <LuStore className="text-xs" /> {totalWeeklyVisits} Toko
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {days.map((day) => {
                    const dayData = row.schedule?.[day];
                    return (
                        <div
                            key={day}
                            onClick={() => onCellClick(row.salesId, day, dayData)}
                            className="bg-surface-container-low border border-border-glass rounded-xl p-2.5 flex flex-col justify-between gap-1.5 cursor-pointer hover:border-primary active:scale-[0.99] transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-extrabold text-on-surface uppercase">
                                    {day}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                    {dayData?.outletsCount || 0} Toko <LuChevronRight className="text-xs" />
                                </span>
                            </div>

                            <div className="text-xs font-extrabold text-on-surface leading-tight">
                                {dayData?.clusterName || 'Libur / Tidak ada jadwal'}
                            </div>

                            <div className="text-[10px] text-on-surface-variant font-medium">
                                Kecamatan: {dayData?.subDistrict || '-'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
