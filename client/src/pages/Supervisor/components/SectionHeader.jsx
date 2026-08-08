import React from 'react';

/**
 * SectionHeader Component
 * Single Responsibility: Render a standardized section title and subtitle for supervisor tabs.
 */
export const SectionHeader = ({ title, subtitle }) => {
    return (
        <div className="mb-3">
            <h3 className="text-base font-bold text-on-surface">{title}</h3>
            {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
        </div>
    );
};
