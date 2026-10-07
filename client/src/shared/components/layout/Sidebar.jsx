import React from 'react';
import { LuLayers } from 'react-icons/lu';
import { useApp } from '../../../context/AppContext';
import {getAdminNavigationGroups,adminParentTab} from '../../../constants/adminNavigation';
import { getNavigationTabs, TAB_IDS } from '../../../constants/navigation';
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
      type="button"
      aria-current={isActive ? 'page' : undefined}
      onClick={() => onClick(item.id)}
      className={`sidebar-nav-btn ${isActive ? 'sidebar-nav-btn-active' : 'sidebar-nav-btn-inactive'}`}
    >
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        <Icon className="text-lg" />
      </div>
      <span className="min-w-0 whitespace-normal leading-snug">{item.label}</span>
    </button>
  );
};

/**
 * Sidebar Layout Component (Desktop Rail)
 * Single Responsibility: Render the desktop navigation sidebar.
 */
export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useApp();
  const navItems = getNavigationTabs(user);
  const groups=user?.role==='ADMIN'?getAdminNavigationGroups(user):null;

  return (
    <aside className="sidebar-container">
      <SidebarBrand />

      <nav className="sidebar-nav" aria-label="Navigasi utama">
        {groups?<>
          <SidebarNavItem item={{...navItems[0],label:'Beranda admin'}} isActive={activeTab===TAB_IDS.ROLE_WORKSPACE} onClick={setActiveTab}/>
          {groups.map(group=><section className="sidebar-nav-group" key={group.id} aria-labelledby={`sidebar-${group.id}`}><h2 id={`sidebar-${group.id}`}>{group.label}</h2>{group.items.map(item=><SidebarNavItem key={item.id} item={item} isActive={adminParentTab(activeTab)===item.id} onClick={setActiveTab}/>)}</section>)}
        </>:navItems.map(item=><SidebarNavItem key={item.id} item={item} isActive={activeTab===item.id} onClick={setActiveTab}/>)}
      </nav>


    </aside>
  );
};
