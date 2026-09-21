import React from 'react';
import { LuSearch, LuLogOut, LuTrendingUp } from 'react-icons/lu';
import { FiCheckCircle } from 'react-icons/fi';
import { Input } from '../common/Input';
import { StatusMonitor } from '../common/StatusMonitor';
import { NotificationCenterDropdown } from './NotificationCenterDropdown';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { getNavigationTabs } from '../../constants/navigation';
import '../../styles/layout/Header.css';

/**
 * Header Layout Component (Desktop Only Top Bar with User Role Info & Notification Dropdown)
 */
export const Header = ({ searchQuery, setSearchQuery, onLogout }) => {
  const { user, activeTab } = useApp();
  const activeTabMeta = getNavigationTabs(user?.role).find((t) => t.id === activeTab);
  const ActiveIcon = activeTabMeta?.icon;

  return (
    <header className="header-container">
      {/* Left: Search Input Bar & Page Breadcrumb */}
      <div className="flex items-center gap-4">
        <div className="w-56 xl:w-72">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {activeTabMeta && (
          <div className="hidden xl:flex items-center gap-2 text-xs font-semibold text-on-surface-variant pl-2 border-l border-border-glass">
            <span>Sinar Anugrah</span>
            <span className="text-border-glass">/</span>
            <span className="text-on-surface font-extrabold flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-lg border border-border-glass">
              {ActiveIcon && <ActiveIcon className="text-primary text-sm" />}
              {activeTabMeta.label}
            </span>
          </div>
        )}
      </div>

      {/* Middle: Active Role Badge */}
      <div className="hidden lg:flex items-center gap-3 bg-surface-container-low/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-border-glass">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-on-surface-variant">Peran Aktif:</span>
          <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass font-bold text-xs rounded-full uppercase tracking-wider">
            {user?.roleLabel || user?.role || 'User'}
          </span>
        </div>
      </div>

      {/* Right Controls: Connectivity Status & User Profile Badge */}
      <div className="header-actions flex items-center gap-3">
        {/* Real-time System Connectivity Indicator */}
        <StatusMonitor label="WIB" />

        {/* Real-time Notification Dropdown */}
        <NotificationCenterDropdown />

        {/* User Profile Badge & Logout */}
        <div
          className="header-user-badge"
          onClick={onLogout}
          title="Klik untuk Keluar (Logout)"
        >
          <Avatar src={user?.avatar} name={user?.name} size="sm" />
          <div className="flex flex-col text-left leading-tight">
            <span className="text-xs font-bold text-on-surface">{user?.name}</span>
            <span className="text-[10px] text-on-surface-variant font-medium">{user?.roleLabel || user?.role}</span>
          </div>
          <LuLogOut className="text-on-surface-variant text-sm ml-1 shrink-0" />
        </div>
      </div>
    </header>
  );
};
