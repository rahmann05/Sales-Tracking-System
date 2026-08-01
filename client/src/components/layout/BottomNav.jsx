import React from 'react';
import {
  LuLayoutDashboard,
  LuNavigation,
  LuUsers,
} from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';
import '../../styles/layout/BottomNav.css';

/**
 * BottomNav Component (Single Responsibility: Mobile Bottom Navigation Bar)
 * 1 File per Component
 */
export const BottomNav = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
    { id: 'route-planning', label: 'Routes', icon: LuNavigation },
    { id: 'team-tracking', label: 'Team', icon: LuUsers },
    { id: 'reports', label: 'Reports', icon: FiBarChart2 },
  ];

  return (
    <nav className="bottom-nav-container">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`bottom-nav-btn ${
              isActive ? 'bottom-nav-btn-active' : 'bottom-nav-btn-inactive'
            }`}
          >
            <Icon className="bottom-nav-icon" />
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
