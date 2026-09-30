import React from 'react';
import { LuLayers, LuLogOut, LuArrowLeft } from 'react-icons/lu';
import { useApp } from '../../../context/AppContext';
import { NotificationCenterDropdown } from './NotificationCenterDropdown';
import { Avatar } from '../common/Avatar';
import { TAB_IDS } from '../../../constants/navigation';
import '../../../styles/layout/MobileHeader.css';

/**
 * MobileHeader Component (Single Responsibility: Mobile Top Title Bar & Synchronized User Role Header)
 */
export const MobileHeader = ({ onLogout }) => {
  const { user, activeTab, setActiveTab } = useApp();
  const isAdmin = user?.role === 'ADMIN';
  const isLanding = activeTab === TAB_IDS.ROLE_WORKSPACE;

  return (
    <header className="mobile-header-container pointer-events-auto z-30">
      {/* Brand Title & Logo or Admin Back Button */}
      <div className="flex items-center gap-2.5">
        {isAdmin && !isLanding ? (
          <button
            type="button"
            onClick={() => setActiveTab(TAB_IDS.ROLE_WORKSPACE)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Kembali ke Menu Utama"
          >
            <LuArrowLeft className="text-xs" />
            <span>Menu</span>
          </button>
        ) : (
          <div className="mobile-brand-icon">
            <LuLayers />
          </div>
        )}
        <div>
          <h1 className="mobile-brand-title">Sinar Anugrah</h1>
          <span className="mobile-brand-subtitle font-bold text-primary">
            {isAdmin ? 'Portal Admin' : user?.roleLabel || user?.role}
          </span>
        </div>
      </div>

      {/* Right Controls: Real-time Notifications & User Profile Badge */}
      <div className="flex items-center gap-2">
        <NotificationCenterDropdown />

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-surface border border-border-glass cursor-pointer hover:bg-surface-variant active:scale-95 transition-all shadow-sm pointer-events-auto"
          title="Klik untuk Keluar (Logout)"
        >
          <Avatar src={user?.avatar} name={user?.name} size="xs" />
          <span className="text-xs font-bold text-on-surface truncate max-w-[85px]">
            {user?.name?.split(' ')[0]}
          </span>
          <LuLogOut className="text-on-surface-variant text-xs shrink-0" />
        </button>
      </div>
    </header>
  );
};
