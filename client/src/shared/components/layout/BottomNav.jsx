import { NativeDialog } from '../common/NativeDialog';
import React, { useState } from 'react';
import { FiMoreHorizontal } from 'react-icons/fi';
import { useApp } from '../../../context/AppContext';
import {getAdminMobileNavigation,getAdminNavigationGroups,adminParentTab} from '../../../constants/adminNavigation';
import { getNavigationTabs } from '../../../constants/navigation';
import '../../../styles/layout/BottomNav.css';

/**
 * BottomNav Component (Mobile Bottom Navigation Bar)
 * Single Responsibility: Symmetric, Apple-Editorial mobile bottom navigation.
 * - Perfectly symmetrical 5-column grid layout across all screen sizes.
 * - Cohesive monochrome styling matching the system design.
 * - Accessible, thumb-friendly touch targets.
 */
export const BottomNav = ({ activeTab, setActiveTab }) => {
  const { user } = useApp();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navItems = getNavigationTabs(user);
  const currentTab=user?.role==='ADMIN'?adminParentTab(activeTab):activeTab;

  const adminNavigation=user?.role==='ADMIN'?getAdminMobileNavigation(user):null;
  const hasMore = adminNavigation?adminNavigation.secondary.length>0:navItems.length>5;
  const primaryItems = adminNavigation?adminNavigation.primary:hasMore?navItems.slice(0,4):navItems;
  const secondaryItems = adminNavigation?adminNavigation.secondary:hasMore?navItems.slice(4):[];
  const menuGroups=user?.role==='ADMIN'?getAdminNavigationGroups(user).map(group=>({...group,items:group.items.filter(item=>secondaryItems.some(tab=>tab.id===item.id))})).filter(group=>group.items.length):[{id:'more',items:secondaryItems}];

  // Check if current active tab is inside secondary drawer
  const activeSecondaryItem = secondaryItems.find((item) => item.id === currentTab);
  const isSecondaryActive = Boolean(activeSecondaryItem);

  const totalCols = primaryItems.length + (hasMore?1:0);
  const shortLabels = { 'role-workspace':'Beranda', 'admin-approval':'Order & izin', 'daily-call-monitor':'Absensi', 'route-planning':'Jadwal', 'outlet-registration':'Outlet baru', 'outlet-management':'Outlet', 'delivery-packing-list':'Packing', 'delivery-routes':'Rute', 'delivery-monitor':'Monitor', 'dashboard':'Peta' };

  return (
    <>
      <NativeDialog open={isMoreOpen} title={user?.role==='ADMIN'?'Menu admin':'Menu lainnya'} onClose={()=>setIsMoreOpen(false)}>
          <div className="mobile-menu-groups">{menuGroups.map(group=><section key={group.id}>{group.label&&<h3>{group.label}</h3>}<div>{group.items.map(item=>{const Icon=item.icon;const isActive=currentTab===item.id;return <button key={item.id} type="button" className={`mobile-menu-link ${isActive?'mobile-menu-link-active':''}`} aria-current={isActive?'page':undefined} onClick={()=>{setActiveTab(item.id);setIsMoreOpen(false);}}><Icon aria-hidden="true"/><span>{item.label}</span></button>;})}</div></section>)}</div>
      </NativeDialog>

      {/* 3. Main Bottom Navigation Bar (Symmetric Grid) */}
      <nav
        aria-label="Navigasi mobile"
        className="bottom-nav-container pointer-events-auto"
        style={{
          gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))`,
        }}
      >
        {primaryItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setIsMoreOpen(false);
              }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`bottom-nav-btn ${
                isActive ? 'bottom-nav-btn-active' : 'bottom-nav-btn-inactive'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-primary/5' : ''}`}>
                <Icon className="bottom-nav-icon" />
              </div>
              <span className="bottom-nav-label">
                {shortLabels[item.id] || item.label}
              </span>
            </button>
          );
        })}

        {/* "Lainnya" Button when items > 5 */}
        {hasMore && (
          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            aria-label={activeSecondaryItem?`Menu lainnya, halaman aktif: ${activeSecondaryItem.label}`:'Menu lainnya'}
              aria-current={isSecondaryActive ? 'page' : undefined}
              className={`bottom-nav-btn ${
              isSecondaryActive || isMoreOpen
                ? 'bottom-nav-btn-active'
                : 'bottom-nav-btn-inactive'
            }`}
            aria-expanded={isMoreOpen}
          >
            <div className={`p-1 rounded-lg transition-colors ${isSecondaryActive || isMoreOpen ? 'bg-primary/5' : ''}`}>
              <FiMoreHorizontal className="bottom-nav-icon" />
            </div>
            <span className="bottom-nav-label">
              {user?.role==='ADMIN'?'Menu':activeSecondaryItem ? activeSecondaryItem.label : 'Lainnya'}
            </span>
          </button>
        )}
      </nav>
    </>
  );
};
