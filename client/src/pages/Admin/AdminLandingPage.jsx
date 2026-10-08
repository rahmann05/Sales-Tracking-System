import React,{useState} from 'react';
import {useApp} from '../../context/AppContext';
import {getAdminNavigationGroups} from '../../constants/adminNavigation';
import {LuArrowUpRight,LuSearch} from 'react-icons/lu';
import '../../styles/pages/AdminNavigation.css';
export function AdminLandingPage(){
  const {user,setActiveTab}=useApp();
  const [search,setSearch]=useState('');
  const query=search.trim().toLocaleLowerCase('id-ID');
  const groups=getAdminNavigationGroups(user).filter(group=>`${group.label} ${group.description} ${group.items.map(item=>item.label).join(' ')}`.toLocaleLowerCase('id-ID').includes(query));
  return <div className="page-container admin-home">
    <header className="admin-home-heading"><div><p className="admin-eyebrow">Sinar Anugrah / Admin</p><h1>Ruang kerja Anda.</h1><p>Pilih pekerjaan yang ingin Anda selesaikan.</p></div><label className="admin-search"><LuSearch aria-hidden="true"/><input type="search" aria-label="Cari menu admin" placeholder="Cari menu atau fitur…" value={search} onChange={event=>setSearch(event.target.value)}/></label></header>
    <div className="admin-home-section"><h2>Menu admin</h2><span>{groups.length} modul tersedia</span></div>
    <div className="admin-home-modules">{groups.map(group=>{const Icon=group.icon;return <section className="admin-module-card" key={group.id}>
      <button type="button" className="admin-module-entry" onClick={()=>setActiveTab(group.items[0].id)}><span className={`admin-module-icon admin-icon-${group.id}`}><Icon aria-hidden="true"/></span><LuArrowUpRight className="admin-module-arrow" aria-hidden="true"/><h2>{group.label}</h2><p>{group.description}</p></button>
      <div className="admin-module-features">{group.items.map(item=><button type="button" key={item.id} onClick={()=>setActiveTab(item.id)}>{item.label}<span aria-hidden="true">›</span></button>)}</div>
    </section>;})}</div>
    {!groups.length&&<div className="admin-empty"><h2>Menu tidak ditemukan</h2><p>Coba kata lain seperti order, outlet, atau pengguna.</p><button type="button" onClick={()=>setSearch('')}>Tampilkan semua menu</button></div>}
  </div>;
}
