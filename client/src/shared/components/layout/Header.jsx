import React, { useState, useRef, useEffect, memo } from 'react';
import {
  LuSearch,
  LuLogOut,
  LuArrowLeft,
  LuLayers,
  LuChevronDown,
  LuLayoutGrid,
} from 'react-icons/lu';
import { Input } from '../common/Input';
import { StatusMonitor } from '../common/StatusMonitor';
import { NotificationCenterDropdown } from './NotificationCenterDropdown';
import { useApp } from '../../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { getNavigationTabs, TAB_IDS } from '../../../constants/navigation';
import '../../../styles/layout/Header.css';

/**
 * Header Layout Component
 * Single Responsibility: Desktop top navigation bar with user info, notifications,
 * and seamless Admin hub navigation (no-sidebar mode).
 */
export const Header = memo(({ searchQuery, setSearchQuery, onLogout }) => {
  const { user, activeTab, setActiveTab } = useApp();
  const isAdmin = user?.role === 'ADMIN';
  const isLanding = activeTab === TAB_IDS.ROLE_WORKSPACE;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navTabs = getNavigationTabs(user);
  const activeTabMeta = navTabs.find((t) => t.id === activeTab);
  const ActiveIcon = activeTabMeta?.icon;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="header-container relative z-20">
      {/* Left: Brand Identity / Admin Hub Navigation */}
      <div className="flex items-center gap-3">
        {isAdmin ? (
          <>
            {isLanding ? (
              <div className="flex items-center gap-2.5 pr-2">
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-lg shadow-xs shrink-0">
                  <LuLayers />
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-tight text-on-surface leading-none m-0">
                    Sinar Anugrah
                  </h1>
                  <span className="text-[10px] font-extrabold text-primary tracking-wider uppercase block mt-0.5">
                    PORTAL ADMIN
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab(TAB_IDS.ROLE_WORKSPACE)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary text-white hover:bg-neutral-800 text-xs font-bold transition-all shadow-xs cursor-pointer group shrink-0"
                title="Kembali ke Menu Utama Admin"
              >
                <LuArrowLeft className="text-sm group-hover:-translate-x-0.5 transition-transform" />
                <span>Menu Utama</span>
              </button>
            )}

            {/* Breadcrumb & Quick Switcher for Admin */}
            {!isLanding && activeTabMeta && (
              <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant pl-2 border-l border-border-glass">
                <span className="text-border-glass">/</span>
                <span className="text-on-surface font-extrabold flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-lg border border-border-glass">
                  {ActiveIcon && <ActiveIcon className="text-primary text-sm" />}
                  {activeTabMeta.label}
                </span>

                {/* Quick Menu Popover Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-border-glass text-[11px] font-bold text-on-surface transition-all cursor-pointer"
                    title="Pindah ke modul lain secara langsung"
                  >
                    <span>Pindah Modul</span>
                    <LuChevronDown
                      className={`text-xs transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-surface border border-border-glass shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1.5 border-b border-border-glass mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                          Navigasi Modul Admin
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(TAB_IDS.ROLE_WORKSPACE);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-bold text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <LuLayoutGrid className="text-xs" />
                        </div>
                        <span>Menu Utama (Landing Page)</span>
                      </button>

                      <div className="border-t border-border-glass my-1" />

                      <div className="max-h-64 overflow-y-auto pr-1">
                        {navTabs
                          .filter((tab) => tab.id !== TAB_IDS.ROLE_WORKSPACE)
                          .map((tab) => {
                            const TabIcon = tab.icon;
                            const isCurrent = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                  setActiveTab(tab.id);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                                  isCurrent
                                    ? 'bg-surface-variant font-bold text-primary'
                                    : 'hover:bg-surface-container text-on-surface'
                                }`}
                              >
                                <div className="w-5 h-5 flex items-center justify-center text-on-surface-variant shrink-0">
                                  <TabIcon className="text-xs" />
                                </div>
                                <span className="truncate">{tab.label}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Standard breadcrumb for non-admin users */
          activeTabMeta && (
            <div className="hidden xl:flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
              <span>Sinar Anugrah</span>
              <span className="text-border-glass">/</span>
              <span className="text-on-surface font-extrabold flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-lg border border-border-glass">
                {ActiveIcon && <ActiveIcon className="text-primary text-sm" />}
                {activeTabMeta.label}
              </span>
            </div>
          )
        )}

        {/* Global Search Input (only for non-admin roles) */}
        {!isAdmin && (
          <div className="w-52 xl:w-64 ml-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari data global..."
            />
          </div>
        )}
      </div>

      {/* Middle: Active Role Badge */}
      <div className="hidden lg:flex items-center gap-3 bg-surface-container-low/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-border-glass">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-on-surface-variant">Peran:</span>
          <span className="px-3 py-0.5 bg-surface-container text-on-surface border border-border-glass font-bold text-xs rounded-full uppercase tracking-wider">
            {user?.roleLabel || user?.role || 'Admin'}
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
            <span className="text-[10px] text-on-surface-variant font-medium">
              {user?.roleLabel || user?.role}
            </span>
          </div>
          <LuLogOut className="text-on-surface-variant text-sm ml-1 shrink-0" />
        </div>
      </div>
    </header>
  );
});
