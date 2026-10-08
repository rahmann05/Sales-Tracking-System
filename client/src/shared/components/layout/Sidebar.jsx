import {managedRoles,roleNavigationGroups,roleHomeLabel,roleParentTab} from '../../../constants/roleNavigation';
import { SidebarBrand } from "./SidebarBrand";
import { SidebarNavItem } from "./SidebarNavItem";
import React from 'react';
import { useApp } from '../../../context/AppContext';
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
  const groups = managedRoles.includes(user?.role)?roleNavigationGroups(user):null;
  return <aside className="sidebar-container">
      <SidebarBrand />

      <nav className="sidebar-nav" aria-label="Navigasi utama">
        {groups ? <>
          <SidebarNavItem item={{
          ...navItems[0],
          label: roleHomeLabel(user?.role)
        }} isActive={activeTab === TAB_IDS.ROLE_WORKSPACE} onClick={setActiveTab} />
          <p className="admin-rail-label">Ruang kerja</p>
          {groups.map(group => <SidebarNavItem key={group.id} item={{id:group.items[0].id,label:group.label,icon:group.icon}} isActive={group.items.some(item=>item.id===roleParentTab(user,activeTab))} onClick={setActiveTab} />)}
        </> : navItems.map(item => <SidebarNavItem key={item.id} item={item} isActive={activeTab === item.id} onClick={setActiveTab} />)}
      </nav>


    </aside>;
};
