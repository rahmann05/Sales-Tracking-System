import React from 'react';
import {
  LuLayoutDashboard,
  LuNavigation,
  LuUsers,
  LuShieldCheck,
  LuFileCheck,
  LuBriefcase,
} from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import '../../styles/layout/BottomNav.css';

/**
 * BottomNav Component (Single Responsibility: Mobile Bottom Navigation Bar Synchronized with User Role)
 * 1 File per Component
 */
export const BottomNav = ({ activeTab, setActiveTab }) => {
  const { user } = useApp();

  const getRoleNavItem = () => {
    switch (user?.role) {
      case 'SALES':
        return { id: 'role-workspace', label: 'Absen & PJP', icon: LuNavigation };
      case 'SUPERVISOR':
        return { id: 'role-workspace', label: 'Supervisi', icon: LuShieldCheck };
      case 'ADMIN':
        return { id: 'role-workspace', label: 'Approval', icon: LuFileCheck };
      case 'OPERATIONAL_MANAGER':
        return { id: 'role-workspace', label: 'Ops Rute', icon: LuBriefcase };
      default:
        return { id: 'role-workspace', label: 'Workspace', icon: LuNavigation };
    }
  };

  const getNavItems = () => {
    const items = [getRoleNavItem()];
    items.push({ id: 'dashboard', label: 'Peta', icon: LuLayoutDashboard });

    if (['SALES', 'SUPERVISOR', 'OPERATIONAL_MANAGER'].includes(user?.role)) {
      items.push({ id: 'route-planning', label: 'Master RJP', icon: LuNavigation });
    }

    if (['SALES', 'SUPERVISOR', 'OPERATIONAL_MANAGER', 'ADMIN'].includes(user?.role)) {
      items.push({ id: 'team-tracking', label: 'Tim', icon: LuUsers });
    }

    if (['SUPERVISOR', 'OPERATIONAL_MANAGER', 'ADMIN'].includes(user?.role)) {
      items.push({ id: 'reports', label: 'Laporan', icon: FiBarChart2 });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <nav className="bottom-nav-container">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`bottom-nav-btn ${isActive ? 'bottom-nav-btn-active' : 'bottom-nav-btn-inactive'
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
