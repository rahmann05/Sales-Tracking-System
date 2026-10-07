import React from 'react';
export const FilterPill = ({
  isActive,
  activeClass,
  onClick,
  children
}) => <button type="button" onClick={onClick} className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-center w-full min-w-0 whitespace-normal break-words ${isActive ? activeClass : 'bg-surface-container-high text-on-surface-variant'}`}>
        {children}
    </button>;

/**
 * MobileMatrixFilters Component
 * Single Responsibility: Filter pills (salesman & hari) untuk tampilan mobile rolling matrix.
 */
