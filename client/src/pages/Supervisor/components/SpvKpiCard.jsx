import React from 'react';

/**
 * SpvKpiCard Component
 * Single Responsibility: Render a single KPI metric tile for the SPV field overview grid.
 */
export const SpvKpiCard = ({ icon: Icon, iconClass = 'text-primary', valueClass = 'text-on-surface', label, value, suffix, footer }) => (
    <div className="p-4 bg-surface rounded-2xl border border-border-glass shadow-sm space-y-1">
        <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
            <Icon className={`${iconClass} text-xs`} /> {label}
        </span>
        <div className={`text-2xl font-black ${valueClass}`}>
            {value} {suffix && <span className="text-xs font-normal text-on-surface-variant">{suffix}</span>}
        </div>
        {footer && <div className="text-[10px] text-primary font-semibold">{footer}</div>}
    </div>
);
