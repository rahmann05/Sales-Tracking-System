import React from 'react';
import { LuLayers } from 'react-icons/lu';
import '../../../styles/layout/Sidebar.css';

/**
 * SidebarBrand Component
 * Single Responsibility: Display the app brand/logo section.
 */

export
/**
 * SidebarBrand Component
 * Single Responsibility: Display the app brand/logo section.
 */
const SidebarBrand = () => <div className="sidebar-brand">
    <div className="flex items-center gap-3">
      <div className="sidebar-brand-icon">
        <LuLayers />
      </div>
      <div>
        <h1 className="sidebar-brand-title">Sinar Anugrah</h1>
        <span className="sidebar-brand-subtitle">PJP & ABSENSI SYSTEM</span>
      </div>
    </div>
  </div>;

/**
 * SidebarNavItem Component
 * Single Responsibility: Render a single navigation button with symmetric icon alignment.
 */
