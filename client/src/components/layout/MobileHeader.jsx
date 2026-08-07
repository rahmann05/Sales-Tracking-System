import React from 'react';
import { LuLayers, LuLogOut } from 'react-icons/lu';
import { useApp } from '../../context/AppContext';
import { NotificationCenterDropdown } from './NotificationCenterDropdown';
import { Avatar } from '../common/Avatar';
import '../../styles/layout/MobileHeader.css';

/**
 * MobileHeader Component (Single Responsibility: Mobile Top Title Bar & Synchronized User Role Header)
 * 1 File per Component
 */
export const MobileHeader = ({ onLogout }) => {
  const { user } = useApp();

  return (
    <header className="mobile-header-container">
      {/* Brand Title & Logo */}
      <div className="flex items-center gap-2.5">
        <div className="mobile-brand-icon">
          <LuLayers />
        </div>
        <div>
          <h1 className="mobile-brand-title">Sinar Anugrah</h1>
          <span className="mobile-brand-subtitle font-bold text-primary">{user?.roleLabel || user?.role}</span>
        </div>
      </div>

      {/* Right Controls: Real-time Notifications & User Profile Badge */}
      <div className="flex items-center gap-2">
        <NotificationCenterDropdown />

        <div
          onClick={onLogout}
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface border border-border-glass cursor-pointer hover:bg-surface-variant transition-all shadow-sm"
          title="Klik untuk Keluar (Logout)"
        >
          <Avatar src={user?.avatar} name={user?.name} size="xs" />
          <span className="text-xs font-bold text-on-surface truncate max-w-[80px]">{user?.name?.split(' ')[0]}</span>
          <LuLogOut className="text-on-surface-variant text-xs" />
        </div>
      </div>
    </header>
  );
};
