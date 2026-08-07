import React from 'react';

/**
 * EmptyState Component
 * Single Responsibility: Display a consistent empty-state placeholder
 * when a list/section has no data to render.
 */
export const EmptyState = ({ message, className = '' }) => {
    return (
        <div className={`p-4 bg-surface border border-border-glass rounded-2xl text-on-surface-variant text-xs font-medium ${className}`}>
            {message}
        </div>
    );
};
