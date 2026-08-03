import React from 'react';
import {
  LuLayoutDashboard,
  LuNavigation,
  LuUsers,
  LuTruck,
  LuShieldCheck,
  LuFileCheck,
  LuBriefcase,
} from 'react-icons/lu';
import { useApp } from '../../context/AppContext';
import '../../styles/layout/BottomNav.css';

/**
 * BottomNav Component (Single Responsibility: Mobile Bottom Navigation Bar with Role Integration)
 * 1 File per Component
 */
export const BottomNav = ({ activeTab, setActiveTab }) => {
  const { user } = useApp();

  const getRoleNavItem = () => {
    switch (user?.role) {
      case 'SALES':
        return { id: 'role-workspace', label: 'Absen & PJP', icon: LuNavigation };
      case 'DRIVER':
      case 'HELPER':
        return { id: 'role-workspace', label: 'Delivery', icon: LuTruck };
      case 'SUPERVISOR':
        return { id: 'role-workspace', label: 'Supervisi', icon: LuShieldCheck };
      case 'ADMIN':
        return { id: 'role-workspace', label: 'Approval', icon: LuFileCheck };
      case 'OPERATIONAL_MANAGER':
        return { id: 'role-workspace', label: 'Ops Rute', icon: LuBriefcase };
      default:
        return { id: 'role-workspace', label: 'Task', icon: LuNavigation };
    }
  };

  const navItems = [
    getRoleNavItem(),
    { id: 'dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
    { id: 'team-tracking', label: 'Tim', icon: LuUsers },
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
