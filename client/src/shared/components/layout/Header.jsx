import {managedRoles,roleNavigationGroups,roleHomeLabel,roleParentTab} from '../../../constants/roleNavigation';
import React, { memo } from 'react';
import { LuLogOut, LuChevronRight } from 'react-icons/lu';
import { StatusMonitor } from '../common/StatusMonitor';
import { MonitoringStatus } from '../common/MonitoringStatus';
import { NotificationCenterDropdown } from './NotificationCenterDropdown';
import { useApp } from '../../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { getNavigationTabs, TAB_IDS } from '../../../constants/navigation';
import '../../../styles/layout/Header.css';

export const Header = memo(({ onLogout }) => {
  const { user, activeTab, setActiveTab } = useApp();
  const tabs = getNavigationTabs(user);
  const groups=roleNavigationGroups(user);
  const group=groups.find(section=>section.items.some(item=>item.id===roleParentTab(user,activeTab)));
  const active=group?.items.find(item=>item.id===activeTab) || tabs.find(tab=>tab.id===activeTab);
  return <header className="header-container relative z-20">
    <div className="header-context">
      {managedRoles.includes(user?.role) ? <nav aria-label="Lokasi halaman" className="admin-breadcrumb"><button type="button" onClick={()=>setActiveTab(TAB_IDS.ROLE_WORKSPACE)}>{roleHomeLabel(user?.role)}</button>{activeTab!==TAB_IDS.ROLE_WORKSPACE&&<><LuChevronRight aria-hidden="true"/>{group&&group.label!==active?.label&&<><span>{group.label}</span><LuChevronRight aria-hidden="true"/></>}<strong>{active?.label || 'Buat kluster'}</strong></>}</nav> : <><span className="header-brand-name">Sinar Anugrah</span><span aria-hidden="true" className="text-on-surface-variant">/</span><span className="header-page-name">{active?.label || 'Operasional'}</span></>}
    </div>
    <div className="header-actions">
      <StatusMonitor label="WIB"/>
      <MonitoringStatus/>
      <NotificationCenterDropdown/>
      <button type="button" className="header-user-badge" onClick={onLogout} title="Keluar dari akun">
        <Avatar src={user?.avatar} name={user?.name} size="sm"/>
        <span className="profile-copy"><span className="profile-name">{user?.name}</span><span className="profile-role">{user?.roleLabel || user?.role}</span></span>
        <LuLogOut aria-hidden="true" className="shrink-0"/>
      </button>
    </div>
  </header>;
});
