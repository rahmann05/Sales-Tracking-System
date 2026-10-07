import React from 'react';
import { LuLayers, LuLogOut, LuArrowLeft } from 'react-icons/lu';
import { useApp } from '../../../context/AppContext';
import { NotificationCenterDropdown } from './NotificationCenterDropdown';
import { Avatar } from '../common/Avatar';
import {getAdminNavigationGroups} from '../../../constants/adminNavigation';
import { TAB_IDS } from '../../../constants/navigation';
import '../../../styles/layout/MobileHeader.css';

/**
 * MobileHeader Component (Single Responsibility: Mobile Top Title Bar & Synchronized User Role Header)
 */
export const MobileHeader = ({ onLogout }) => {
  const { user, activeTab, setActiveTab } = useApp();
  const isAdmin = user?.role === 'ADMIN';
  const currentAdmin=getAdminNavigationGroups(user).flatMap(group=>group.items).find(item=>item.id===activeTab);
  const isLanding = activeTab === TAB_IDS.ROLE_WORKSPACE;

  return (
    <header className={`mobile-header-container pointer-events-auto z-30 ${isAdmin?'mobile-header-admin':''}`}>
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
          <h1 className="mobile-brand-title">{isAdmin?(isLanding?'Beranda admin':currentAdmin?.label || 'Buat kluster'):'Sinar Anugrah'}</h1>
          <span className="mobile-brand-subtitle font-bold text-primary">
            Operasional distribusi
          </span>
        </div>
      </div>

      {/* Right Controls: Real-time Notifications & User Profile Badge */}
      <div className="flex items-center gap-2">
        <NotificationCenterDropdown />

        <button
          type="button"
          onClick={onLogout}
          className="header-user-badge mobile-profile"
          title="Klik untuk Keluar (Logout)"
        >
          <Avatar src={user?.avatar} name={user?.name} size="xs" />
          <span className="profile-copy"><span className="profile-name">{user?.name}</span><span className="profile-role">{user?.roleLabel || user?.role}</span></span>
          <LuLogOut className="text-on-surface-variant text-xs shrink-0" />
        </button>
      </div>
    </header>
  );
};
