import React from 'react';

/**
 * SectionHeader Component
 * Single Responsibility: Display a consistent section title + subtitle block
 * used across pages for section separation.
 */
export const SectionHeader = ({ title, subtitle }) => {
    return (
        <div>
            <h3 className="section-title">{title}</h3>
            <p className="card-subtitle">{subtitle}</p>
        </div>
    );
};
