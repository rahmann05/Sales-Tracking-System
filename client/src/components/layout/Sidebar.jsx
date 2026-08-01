import React from 'react';
import {
  LuLayoutDashboard,
  LuNavigation,
  LuUsers,
  LuLayers,
} from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';
import '../../styles/layout/Sidebar.css';

/**
 * Sidebar Layout Component (Desktop Only Rail)
 */
export const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
    { id: 'route-planning', label: 'Route Planning', icon: LuNavigation },
    { id: 'team-tracking', label: 'Team Tracking', icon: LuUsers },
    { id: 'reports', label: 'Reports & Analytics', icon: FiBarChart2 },
  ];

  return (
    <aside className="sidebar-container">
      {/* Brand Logo & Title */}
      <div className="sidebar-brand">
        <div className="flex items-center gap-3">
          <div className="sidebar-brand-icon">
            <LuLayers />
          </div>
          <div>
            <h1 className="sidebar-brand-title">SalesFlow</h1>
            <span className="sidebar-brand-subtitle">SINAR ANUGRAH</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
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

      {/* Sidebar Footer Card */}
      <div className="sidebar-footer-card">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Live Status
          </span>
          <span className="pulse-dot"></span>
        </div>
        <p className="text-xs font-semibold text-on-surface">
          Route Optimizer Active
        </p>
        <span className="text-xs text-on-surface-variant">
          Syncing with Express REST API
        </span>
      </div>
    </aside>
  );
};
