import React from 'react';
import {
  LuLayoutDashboard,
  LuNavigation,
  LuUsers,
  LuLayers,
  LuTruck,
  LuShieldCheck,
  LuFileCheck,
  LuBriefcase,
} from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import '../../styles/layout/Sidebar.css';

/**
 * Sidebar Layout Component (Desktop Only Rail with Role-specific Nav Items)
 */
export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useApp();

  const getRoleNavItem = () => {
    switch (user?.role) {
      case 'SALES':
        return { id: 'role-workspace', label: 'PJP Sales Field', icon: LuNavigation };
      case 'DRIVER':
      case 'HELPER':
        return { id: 'role-workspace', label: 'Delivery Manifest H+1', icon: LuTruck };
      case 'SUPERVISOR':
        return { id: 'role-workspace', label: 'Supervisi Insiden Toko', icon: LuShieldCheck };
      case 'ADMIN':
        return { id: 'role-workspace', label: 'Approval Order Admin', icon: LuFileCheck };
      case 'OPERATIONAL_MANAGER':
        return { id: 'role-workspace', label: 'Persetujuan Rute Ops', icon: LuBriefcase };
      default:
        return { id: 'role-workspace', label: 'Workspace', icon: LuNavigation };
    }
  };

  const navItems = [
    getRoleNavItem(),
    { id: 'dashboard', label: 'Peta & Dashboard', icon: LuLayoutDashboard },
    { id: 'route-planning', label: 'Kelola Master PJP', icon: LuNavigation },
    { id: 'team-tracking', label: 'Tracking Tim Field', icon: LuUsers },
    { id: 'reports', label: 'Laporan & Analitik', icon: FiBarChart2 },
  ];

  return (
    <aside className="sidebar-container">
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

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-btn ${
                isActive ? 'sidebar-nav-btn-active' : 'sidebar-nav-btn-inactive'
              }`}
            >
              <Icon className="text-xl" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer-card">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Role Aktif
          </span>
          <span className="pulse-dot"></span>
        </div>
        <p className="text-xs font-semibold text-on-surface">
          {user?.roleLabel || user?.role}
        </p>
        <span className="text-xs text-on-surface-variant">
          Express REST API Connected
        </span>
      </div>
    </aside>
  );
};
