import React from 'react';
import { LuLayers, LuUser, LuLogOut, LuSearch } from 'react-icons/lu';
import '../../styles/layout/MobileHeader.css';

/**
 * MobileHeader Component (Single Responsibility: Mobile Top Title Bar & Executive Header)
 * 1 File per Component
 */
export const MobileHeader = ({ onLogout }) => {
  return (
    <header className="mobile-header-container">
      {/* Brand Title & Logo */}
      <div className="flex items-center gap-2.5">
        <div className="mobile-brand-icon">
          <LuLayers />
        </div>
        <div>
          <h1 className="mobile-brand-title">SalesFlow</h1>
          <span className="mobile-brand-subtitle">SINAR ANUGRAH</span>
        </div>
      </div>

      {/* Right Controls: Executive Admin Badge & Logout */}
      <div className="flex items-center gap-2">
        <div
          onClick={onLogout}
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-low border border-border-glass cursor-pointer"
          title="Klik untuk Keluar (Logout)"
        >
          <div className="mobile-user-avatar">
            <LuUser />
          </div>
          <span className="text-xs font-bold text-on-surface">Admin</span>
          <LuLogOut className="text-on-surface-variant text-xs" />
        </div>
      </div>
    </header>
  );
};
