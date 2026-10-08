import {managedRoles,roleNavigationGroups,roleHomeLabel,roleParentTab} from '../../../constants/roleNavigation';
import React from 'react';
import { LuLayers, LuLogOut, LuArrowLeft } from 'react-icons/lu';
import { useApp } from '../../../context/AppContext';
import { NotificationCenterDropdown } from './NotificationCenterDropdown';
import { Avatar } from '../common/Avatar';
import { MonitoringStatus } from '../common/MonitoringStatus';
import { TAB_IDS } from '../../../constants/navigation';
import '../../../styles/layout/MobileHeader.css';

/**
 * MobileHeader Component (Single Responsibility: Mobile Top Title Bar & Synchronized User Role Header)
 */
export const MobileHeader = ({ onLogout }) => {
  const { user, activeTab, setActiveTab } = useApp();
  const isAdmin = managedRoles.includes(user?.role);
  const currentAdmin=roleNavigationGroups(user).flatMap(group=>group.items).find(item=>item.id===roleParentTab(user,activeTab));
  const isLanding = activeTab === TAB_IDS.ROLE_WORKSPACE;

  return (
    <header className={`mobile-header-container pointer-events-auto z-30 ${isAdmin?'mobile-header-admin':''}`}>
      {/* Brand Title & Logo or Admin Back Button */}
      <div className="mobile-header-brand flex items-center gap-2.5">
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
          <p className="mobile-brand-title">{isAdmin?(isLanding?roleHomeLabel(user?.role):currentAdmin?.label || 'Buat kluster'):'Sinar Anugrah'}</p>
          <span className="mobile-brand-subtitle font-bold text-primary">
            Operasional distribusi
          </span>
        </div>
      </div>

      {/* Right Controls: Real-time Notifications & User Profile Badge */}
      <div className="mobile-header-actions flex items-center gap-2">
        <MonitoringStatus />
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
