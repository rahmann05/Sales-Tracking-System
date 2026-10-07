import React from 'react';
import '../../../styles/layout/Sidebar.css';

/**
 * SidebarBrand Component
 * Single Responsibility: Display the app brand/logo section.
 */

export
/**
 * SidebarNavItem Component
 * Single Responsibility: Render a single navigation button with symmetric icon alignment.
 */
const SidebarNavItem = ({
  item,
  isActive,
  onClick
}) => {
  const Icon = item.icon;
  return <button type="button" aria-current={isActive ? 'page' : undefined} onClick={() => onClick(item.id)} className={`sidebar-nav-btn ${isActive ? 'sidebar-nav-btn-active' : 'sidebar-nav-btn-inactive'}`}>
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        <Icon className="text-lg" />
      </div>
      <span className="min-w-0 whitespace-normal leading-snug">{item.label}</span>
    </button>;
};

/**
 * Sidebar Layout Component (Desktop Rail)
 * Single Responsibility: Render the desktop navigation sidebar.
 */
