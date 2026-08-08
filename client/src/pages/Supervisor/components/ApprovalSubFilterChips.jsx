import React from 'react';
import { APPROVAL_SUB_FILTERS } from '../../../constants/supervisor';

/**
 * ApprovalSubFilterChips Component
 * Single Responsibility: Sub-filter chips untuk tab Antrean Approval Supervisor.
 */
export const ApprovalSubFilterChips = ({ activeFilter, onSelectFilter, counts = {} }) => (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {APPROVAL_SUB_FILTERS.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            const count = counts[filter.id] ?? 0;
            const label = filter.id === 'ALL' ? `${filter.label} (${count})` : `${filter.label} (${count})`;

            return (
                <button
                    key={filter.id}
                    type="button"
                    onClick={() => onSelectFilter(filter.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${isActive
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40'
                        }`}
                >
                    {Icon && <Icon className="text-xs" />}
                    {label}
                </button>
            );
        })}
    </div>
);
