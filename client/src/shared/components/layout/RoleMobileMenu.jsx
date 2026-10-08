import React,{useState} from 'react';
import {LuMenu,LuHouse} from 'react-icons/lu';
import {useApp} from '../../../context/AppContext';
import {roleNavigationGroups,roleHomeLabel} from '../../../constants/roleNavigation';
import {TAB_IDS} from '../../../constants/navigation';
import {NativeDialog} from '../common/NativeDialog';
export function RoleMobileMenu(){
  const {user,activeTab,setActiveTab}=useApp();
  const [open,setOpen]=useState(false),groups=roleNavigationGroups(user);
  const current=groups.find(group=>group.items.some(item=>item.id===activeTab));
  return <><nav className="sales-mobile-nav" aria-label={roleHomeLabel(user?.role)}><button type="button" onClick={()=>setActiveTab(TAB_IDS.ROLE_WORKSPACE)}><LuHouse/>Beranda</button><span>{current?.label||'Ruang kerja'}</span><button type="button" onClick={()=>setOpen(true)} aria-expanded={open}><LuMenu/>Menu</button></nav><NativeDialog open={open} title={roleHomeLabel(user?.role)} onClose={()=>setOpen(false)}><div className="mobile-menu-groups">{groups.map(group=><section key={group.id}><h3>{group.label}</h3>{group.items.map(item=>{const Icon=item.icon;return <button type="button" key={item.id} className="mobile-menu-link" aria-current={activeTab===item.id?'page':undefined} onClick={()=>{setActiveTab(item.id);setOpen(false);}}><Icon/>{item.label}</button>;})}</section>)}</div></NativeDialog></>;
}
