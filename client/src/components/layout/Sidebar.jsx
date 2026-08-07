import React from 'react';
import { LuLayers } from 'react-icons/lu';
import { useApp } from '../../context/AppContext';
import { getNavigationTabs } from '../../constants/navigation';
import '../../styles/layout/Sidebar.css';

/**
 * SidebarBrand Component
 * Single Responsibility: Display the app brand/logo section.
 */
const SidebarBrand = () => (
  <div className="sidebar-brand">
    <div className="flex items-center gap-3">
      <div className="sidebar-brand-icon">
        <LuLayers />
      </div>
      <div>
        <h1 className="sidebar-brand-title">Sinar Anugrah</h1>
        <span className="sidebar-brand-subtitle">PJP & ABSENSI SYSTEM</span>
      </div>
    </div>
  </div>
);

/**
 * SidebarNavItem Component
 * Single Responsibility: Render a single navigation button.
 */
const SidebarNavItem = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onClick(item.id)}
      className={`sidebar-nav-btn ${isActive ? 'sidebar-nav-btn-active' : 'sidebar-nav-btn-inactive'}`}
    >
      <Icon className="text-xl" />
      <span>{item.label}</span>
    </button>
  );
};

/**
 * SidebarRoleBadge Component
 * Single Responsibility: Display the current active role badge.
 */
const SidebarRoleBadge = ({ roleLabel }) => (
  <div className="sidebar-footer-card">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-secondary">
        Role Aktif
      </span>
      <span className="pulse-dot"></span>
    </div>
    <p className="text-xs font-semibold text-on-surface">{roleLabel}</p>
    <span className="text-xs text-on-surface-variant">
      Express REST API Connected
    </span>
  </div>
);

/**
 * Sidebar Layout Component (Desktop Rail)
 * Single Responsibility: Render the desktop navigation sidebar.
 */
export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useApp();
  const navItems = getNavigationTabs(user?.role);

  return (
    <aside className="sidebar-container">
      <SidebarBrand />

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
            onClick={setActiveTab}
          />
        ))}
      </nav>

      <SidebarRoleBadge roleLabel={user?.roleLabel || user?.role} />
    </aside>
  );
};
