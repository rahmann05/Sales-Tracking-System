import React from 'react';
import {AttentionPanel} from '../../shared/components/common/AttentionPanel';
import {useApp} from '../../context/AppContext';
import {TAB_IDS} from '../../constants/navigation';
import {getAdminNavigationGroups} from '../../constants/adminNavigation';
import {AdminFeatureCard} from './components/AdminFeatureCard';
import '../../styles/pages/AdminNavigation.css';

export function AdminLandingPage(){
  const {user,orders=[],setActiveTab}=useApp();
  const groups=getAdminNavigationGroups(user);
  const pending=orders.filter(order=>order.status==='PENDING_APPROVAL').length;
  const quickIds=[TAB_IDS.ADMIN_APPROVAL,TAB_IDS.DELIVERY_PACKING_LIST,TAB_IDS.DELIVERY_MONITOR,TAB_IDS.REPORTS];
  const items=groups.flatMap(group=>group.items);
  return <div className="page-container admin-home">
    <header className="admin-home-heading"><div><p className="admin-home-eyebrow">Administrasi distribusi</p><h1>Beranda admin</h1><p>Pilih pekerjaan yang ingin Anda selesaikan.</p></div><span className="admin-home-greeting">{user?.name}</span></header>
    <AttentionPanel/>
    <section aria-labelledby="admin-quick-title"><div className="admin-section-heading"><h2 id="admin-quick-title">Akses cepat</h2><p>Persetujuan, persiapan muatan, jadwal, dan laporan.</p></div><div className="admin-quick-grid">{quickIds.map(id=>items.find(item=>item.id===id)).filter(Boolean).map(item=>{const Icon=item.icon;return <button type="button" key={item.id} className="admin-quick-link" onClick={()=>setActiveTab(item.id)}><Icon aria-hidden="true"/><span>{item.label}</span>{item.id===TAB_IDS.ADMIN_APPROVAL&&pending>0&&<span className="admin-pending-count">{pending} order menunggu</span>}</button>;})}</div></section>
    <nav className="admin-category-links" aria-label="Kategori menu admin">{groups.map(group=><a href={`#admin-${group.id}`} key={group.id}>{group.label}</a>)}</nav>
    <div className="admin-menu-sections">{groups.map(group=><section id={`admin-${group.id}`} key={group.id} aria-labelledby={`admin-title-${group.id}`}><div className="admin-section-heading"><h2 id={`admin-title-${group.id}`}>{group.label}</h2><p>{group.description}</p></div><div className="admin-menu-grid">{group.items.map(item=><AdminFeatureCard key={item.id} id={item.id} title={item.label} description={item.description} icon={item.icon} onClick={setActiveTab}/>)}</div></section>)}</div>
  </div>;
}
