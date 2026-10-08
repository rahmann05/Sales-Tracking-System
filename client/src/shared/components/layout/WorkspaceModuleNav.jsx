import React from 'react';
import {useApp} from '../../../context/AppContext';
import {roleNavigationGroups,roleParentTab} from '../../../constants/roleNavigation';
export function WorkspaceModuleNav(){
  const {user,activeTab,setActiveTab}=useApp();
  const current=roleParentTab(user,activeTab);
  const group=roleNavigationGroups(user).find(section=>section.items.some(item=>item.id===current));
  if(!group||user?.role!=='ADMIN'&&group.items.length<2)return null;
  return <nav className="admin-module-nav" aria-label={`Fitur ${group.label}`}>{group.items.map(item=><button type="button" key={item.id} aria-current={item.id===current?'page':undefined} onClick={()=>setActiveTab(item.id)}>{item.label}</button>)}</nav>;
}
