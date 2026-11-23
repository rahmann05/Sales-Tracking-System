import React from 'react';
import '../../../styles/layout/Sidebar.css';

/**
 * SidebarBrand Component
 * Single Responsibility: Display the app brand/logo section.
 */

export const SidebarBrand = () => (
  <div className="sidebar-brand">
    <div className="flex items-center gap-3">
      <div className="sidebar-brand-icon overflow-hidden shadow-xs bg-white">
        <img
          src="/logo-mark.png"
          alt="Sinar Anugrah"
          className="w-full h-full object-contain p-0.5"
        />
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
