import React from 'react';
import { LuLayers } from 'react-icons/lu';
import { useApp } from '../../../context/AppContext';
import { getNavigationTabs } from '../../../constants/navigation';
import '../../../styles/layout/Sidebar.css';

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
 * Single Responsibility: Render a single navigation button with symmetric icon alignment.
 */
const SidebarNavItem = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onClick(item.id)}
      className={`sidebar-nav-btn ${isActive ? 'sidebar-nav-btn-active' : 'sidebar-nav-btn-inactive'}`}
    >
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        <Icon className="text-lg" />
      </div>
      <span className="truncate">{item.label}</span>
    </button>
  );
};

/**
 * SidebarRoleBadge Component
 * Single Responsibility: Display the current active role badge with cohesive styling.
 */
const SidebarRoleBadge = ({ roleLabel }) => (
  <div className="sidebar-footer-card">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
        Peran Aktif
      </span>
      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
    </div>
    <p className="text-xs font-bold text-on-surface m-0">{roleLabel}</p>
    <span className="text-[11px] text-on-surface-variant m-0">
      Sistem Distribusi Terhubung
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
