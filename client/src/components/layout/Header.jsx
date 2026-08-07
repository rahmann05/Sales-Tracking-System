import React from 'react';
import { LuSearch, LuLogOut, LuTrendingUp } from 'react-icons/lu';
import { FiCheckCircle } from 'react-icons/fi';
import { Input } from '../common/Input';
import { StatusMonitor } from '../common/StatusMonitor';
import { NotificationCenterDropdown } from './NotificationCenterDropdown';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import '../../styles/layout/Header.css';

/**
 * Header Layout Component (Desktop Only Top Bar with User Role Info & Notification Dropdown)
 */
export const Header = ({ searchQuery, setSearchQuery, onLogout }) => {
  const { user } = useApp();

  return (
    <header className="header-container">
      {/* Left: Search Input Bar */}
      <div className="w-64 xl:w-80">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Middle: Active Role Badge */}
      <div className="hidden lg:flex items-center gap-3 bg-surface-container-low/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-border-glass">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-on-surface-variant">Peran Aktif Login:</span>
          <span className="px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full uppercase tracking-wider">
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
          className="header-user-badge cursor-pointer hover:bg-surface-variant/50 transition-all p-1.5 rounded-xl border border-border-glass"
          onClick={onLogout}
          title="Klik untuk Keluar (Logout)"
        >
          <Avatar src={user?.avatar} name={user?.name} size="sm" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-on-surface">{user?.name}</span>
            <span className="text-[10px] text-on-surface-variant font-medium">{user?.role}</span>
          </div>
          <LuLogOut className="text-on-surface-variant text-base ml-1" />
        </div>
      </div>
    </header>
  );
};
