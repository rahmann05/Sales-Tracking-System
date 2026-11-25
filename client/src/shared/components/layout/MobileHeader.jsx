import {
  managedRoles,
  roleNavigationGroups,
  roleHomeLabel,
  roleParentTab,
} from '../../../constants/roleNavigation';
import React from 'react';
import { LuLogOut, LuMenu } from 'react-icons/lu';
import { useApp } from '../../../context/AppContext';
import { NotificationCenterDropdown } from './NotificationCenterDropdown';
import { Avatar } from '../common/Avatar';
import { getNavigationTabs, TAB_IDS } from '../../../constants/navigation';
import '../../../styles/layout/MobileHeader.css';

/**
 * MobileHeader Component (Single Responsibility: Mobile Top Title Bar & Synchronized User Role Header)
 */
export const MobileHeader = ({ onLogout }) => {
  const { user, activeTab, setActiveTab } = useApp();
  const isAdmin = managedRoles.includes(user?.role);
  const currentAdmin =
    roleNavigationGroups(user)
      .flatMap((group) => group.items)
      .find((item) => item.id === roleParentTab(user, activeTab)) ||
    getNavigationTabs(user?.role).find((tab) => tab.id === activeTab);
  const isLanding = activeTab === TAB_IDS.ROLE_WORKSPACE;

  return (
    <header
      className={`mobile-header-container pointer-events-auto z-30 ${isAdmin ? 'mobile-header-admin' : ''}`}
    >
      {/* Brand Title & Logo or Admin Back Button */}
      <div className="mobile-header-brand flex items-center gap-2.5">
        {isAdmin && !isLanding ? (
          <button
            type="button"
            onClick={() => setActiveTab(TAB_IDS.ROLE_WORKSPACE)}
            className="mobile-menu-button"
            title="Kembali ke Menu Utama"
            aria-label="Kembali ke Menu Utama"
          >
            <LuMenu aria-hidden="true" />
          </button>
        ) : (
          <div className="mobile-brand-icon overflow-hidden bg-white">
            <img
              src="/logo-mark.png"
              alt="Sinar Anugrah"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="mobile-brand-title">
            {isAdmin
              ? isLanding
                ? roleHomeLabel(user?.role)
                : currentAdmin?.label ||
                  (activeTab === TAB_IDS.CREATE_CLUSTER ? 'Buat kluster' : 'Halaman operasional')
              : 'Sinar Anugrah'}
          </p>
          <span className="mobile-brand-subtitle font-bold text-primary">
            Operasional distribusi
          </span>
        </div>
      </div>

      {/* Right Controls: Real-time Notifications & User Profile Badge */}
      <div className="mobile-header-actions flex items-center gap-2">
        <NotificationCenterDropdown />

        <button
          type="button"
          onClick={onLogout}
          className="header-user-badge mobile-profile"
          title="Klik untuk Keluar (Logout)"
        >
          <Avatar src={user?.avatar} name={user?.name} size="xs" />
          <span className="profile-copy">
            <span className="profile-name">{user?.name}</span>
            <span className="profile-role">{user?.roleLabel || user?.role}</span>
          </span>
          <LuLogOut className="text-on-surface-variant text-xs shrink-0" />
        </button>
      </div>
    </header>
  );
};
