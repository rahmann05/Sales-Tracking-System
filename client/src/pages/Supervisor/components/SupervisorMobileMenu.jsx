import React, { useState } from 'react';
import { LuHouse, LuMenu } from 'react-icons/lu';
import { useApp } from '../../../context/AppContext';
import { TAB_IDS } from '../../../constants/navigation';
import {
  getSupervisorActiveGroup,
  getSupervisorNavigationGroups,
  supervisorParentTab,
} from '../../../constants/supervisorNavigation';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';

export function SupervisorMobileMenu() {
  const { user, activeTab, setActiveTab } = useApp();
  const [open, setOpen] = useState(false);
  const group = getSupervisorActiveGroup(user, activeTab);
  const currentTabId = supervisorParentTab(activeTab);

  return (
    <>
      <nav className="spv-mobile-nav" aria-label="Navigasi Supervisor">
        <button type="button" onClick={() => setActiveTab(TAB_IDS.ROLE_WORKSPACE)}>
          <LuHouse />
          Beranda
        </button>
        <span>{group?.label || 'Ruang kerja'}</span>
        <button type="button" onClick={() => setOpen(true)} aria-expanded={open}>
          <LuMenu />
          Menu
        </button>
      </nav>
      <NativeDialog open={open} title="Menu Supervisor" onClose={() => setOpen(false)}>
        <div className="mobile-menu-groups">
          {getSupervisorNavigationGroups(user).map((item) => {
            const Icon = item.icon;
            return (
              <section key={item.id}>
                <h3>{item.label}</h3>
                {item.items.map((subItem) => {
                  const SubIcon = subItem.icon || Icon;
                  return (
                    <button
                      type="button"
                      key={subItem.id}
                      className="mobile-menu-link"
                      aria-current={currentTabId === subItem.id ? 'page' : undefined}
                      onClick={() => {
                        setActiveTab(subItem.id);
                        setOpen(false);
                      }}
                    >
                      <SubIcon />
                      {subItem.label}
                    </button>
                  );
                })}
              </section>
            );
          })}
        </div>
      </NativeDialog>
    </>
  );
}
