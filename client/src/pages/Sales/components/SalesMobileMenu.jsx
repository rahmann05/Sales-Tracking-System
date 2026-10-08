import React,{useState} from 'react';
import {LuMenu,LuHouse} from 'react-icons/lu';
import {useApp} from '../../../context/AppContext';
import {getSalesNavigationGroups} from '../../../constants/salesNavigation';
import {TAB_IDS} from '../../../constants/navigation';
import {NativeDialog} from '../../../shared/components/common/NativeDialog';
export function SalesMobileMenu(){
  const {user,activeTab,setActiveTab}=useApp();
  const [open,setOpen]=useState(false),groups=getSalesNavigationGroups(user);
  const current=groups.find(group=>group.items.some(item=>item.id===activeTab));
  return <><nav className="sales-mobile-nav" aria-label="Navigasi Sales"><button type="button" onClick={()=>setActiveTab(TAB_IDS.ROLE_WORKSPACE)}><LuHouse/>Beranda</button><span>{current?.label||'Ruang kerja'}</span><button type="button" onClick={()=>setOpen(true)} aria-expanded={open}><LuMenu/>Menu</button></nav><NativeDialog open={open} title="Menu Sales" onClose={()=>setOpen(false)}><div className="mobile-menu-groups">{groups.map(group=><section key={group.id}><h3>{group.label}</h3>{group.items.map(item=>{const Icon=item.icon;return <button type="button" key={item.id} className="mobile-menu-link" aria-current={activeTab===item.id?'page':undefined} onClick={()=>{setActiveTab(item.id);setOpen(false);}}><Icon/>{item.label}</button>;})}</section>)}</div></NativeDialog></>;
}
