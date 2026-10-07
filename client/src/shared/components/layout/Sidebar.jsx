import { SidebarBrand } from "./SidebarBrand";
import { SidebarNavItem } from "./SidebarNavItem";
import React from 'react';
import { useApp } from '../../../context/AppContext';
import { getAdminNavigationGroups, adminParentTab } from '../../../constants/adminNavigation';
import { getNavigationTabs, TAB_IDS } from '../../../constants/navigation';
import '../../../styles/layout/Sidebar.css';

/**
 * SidebarBrand Component
 * Single Responsibility: Display the app brand/logo section.
 */

/**
 * Sidebar Layout Component (Desktop Rail)
 * Single Responsibility: Render the desktop navigation sidebar.
 */
export const Sidebar = ({
  activeTab,
  setActiveTab
}) => {
  const {
    user
  } = useApp();
  const navItems = getNavigationTabs(user);
  const groups = user?.role === 'ADMIN' ? getAdminNavigationGroups(user) : null;
  return <aside className="sidebar-container">
      <SidebarBrand />

      <nav className="sidebar-nav" aria-label="Navigasi utama">
        {groups ? <>
          <SidebarNavItem item={{
          ...navItems[0],
          label: 'Beranda admin'
        }} isActive={activeTab === TAB_IDS.ROLE_WORKSPACE} onClick={setActiveTab} />
          {groups.map(group => <section className="sidebar-nav-group" key={group.id} aria-labelledby={`sidebar-${group.id}`}><h2 id={`sidebar-${group.id}`}>{group.label}</h2>{group.items.map(item => <SidebarNavItem key={item.id} item={item} isActive={adminParentTab(activeTab) === item.id} onClick={setActiveTab} />)}</section>)}
        </> : navItems.map(item => <SidebarNavItem key={item.id} item={item} isActive={activeTab === item.id} onClick={setActiveTab} />)}
      </nav>


    </aside>;
};
