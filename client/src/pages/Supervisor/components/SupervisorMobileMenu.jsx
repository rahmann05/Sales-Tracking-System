import React,{useState} from 'react';
import {LuMenu,LuHouse} from 'react-icons/lu';
import {useApp} from '../../../context/AppContext';
import {getSupervisorNavigationGroups,getSupervisorActiveGroup} from '../../../constants/supervisorNavigation';
import {TAB_IDS} from '../../../constants/navigation';
import {NativeDialog} from '../../../shared/components/common/NativeDialog';
export function SupervisorMobileMenu(){
  const {user,activeTab,setActiveTab}=useApp();
  const [open,setOpen]=useState(false);
  const group=getSupervisorActiveGroup(user,activeTab);
  return <><nav className="spv-mobile-nav" aria-label="Navigasi Supervisor"><button type="button" onClick={()=>setActiveTab(TAB_IDS.ROLE_WORKSPACE)}><LuHouse/>Beranda</button><span>{group?.label||'Ruang kerja'}</span><button type="button" onClick={()=>setOpen(true)} aria-expanded={open}><LuMenu/>Menu</button></nav><NativeDialog open={open} title="Menu Supervisor" onClose={()=>setOpen(false)}><div className="mobile-menu-groups">{getSupervisorNavigationGroups(user).map(item=>{const Icon=item.icon;return <section key={item.id}><button type="button" className="mobile-menu-link" aria-current={group?.id===item.id?'page':undefined} onClick={()=>{setActiveTab(item.items[0].id);setOpen(false);}}><Icon/>{item.label}</button></section>;})}</div></NativeDialog></>;
}
