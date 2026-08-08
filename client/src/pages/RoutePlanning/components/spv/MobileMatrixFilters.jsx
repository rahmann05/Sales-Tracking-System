import React from 'react';
import { LuUser, LuCalendar } from 'react-icons/lu';

const FilterPill = ({ isActive, activeClass, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${isActive ? activeClass : 'bg-surface-container-high text-on-surface-variant'
            }`}
    >
        {children}
    </button>
);

/**
 * MobileMatrixFilters Component
 * Single Responsibility: Filter pills (salesman & hari) untuk tampilan mobile rolling matrix.
 */
export const MobileMatrixFilters = ({
    matrixRows,
    days,
    selectedSales,
    onSelectSales,
    selectedDay,
    onSelectDay,
}) => (
    <div className="space-y-2 mb-4 bg-surface-container-low p-3 rounded-2xl border border-border-glass">
        <div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <LuUser className="text-xs text-primary" /> Filter Salesman:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <FilterPill
                    isActive={selectedSales === 'ALL'}
                    activeClass="bg-primary text-on-primary shadow-sm"
                    onClick={() => onSelectSales('ALL')}
                >
                    Semua Sales ({matrixRows.length})
                </FilterPill>
                {matrixRows.map((row) => (
                    <FilterPill
                        key={row.salesId}
                        isActive={selectedSales === row.salesId}
                        activeClass="bg-primary text-on-primary shadow-sm"
                        onClick={() => onSelectSales(row.salesId)}
                    >
                        {row.salesName}
                    </FilterPill>
                ))}
            </div>
        </div>

        <div>
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <LuCalendar className="text-xs text-emerald-600" /> Filter Hari:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <FilterPill
                    isActive={selectedDay === 'ALL'}
                    activeClass="bg-emerald-600 text-white shadow-sm"
                    onClick={() => onSelectDay('ALL')}
                >
                    Semua Hari
                </FilterPill>
                {days.map((day) => (
                    <FilterPill
                        key={day}
                        isActive={selectedDay === day}
                        activeClass="bg-emerald-600 text-white shadow-sm"
                        onClick={() => onSelectDay(day)}
                    >
                        {day}
                    </FilterPill>
                ))}
            </div>
        </div>
    </div>
);
