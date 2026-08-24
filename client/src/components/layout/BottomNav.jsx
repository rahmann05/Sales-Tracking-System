import React from 'react';
import { useApp } from '../../context/AppContext';
import { getNavigationTabs } from '../../constants/navigation';
import '../../styles/layout/BottomNav.css';

/**
 * BottomNav Component (Single Responsibility: Mobile Bottom Navigation Bar Synchronized with User Role)
 */
export const BottomNav = ({ activeTab, setActiveTab }) => {
  const { user } = useApp();

  const navItems = getNavigationTabs(user?.role);

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
