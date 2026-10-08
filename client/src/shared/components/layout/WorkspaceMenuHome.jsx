import React,{useState} from 'react';
import {LuArrowUpRight,LuSearch} from 'react-icons/lu';
import '../../../styles/pages/AdminNavigation.css';
export function WorkspaceMenuHome({role,title,description,groups,onNavigate,className=''}){
  const [search,setSearch]=useState('');
  const query=search.trim().toLocaleLowerCase('id-ID');
  const visible=groups.filter(group=>`${group.label} ${group.description} ${group.items.map(item=>item.label).join(' ')}`.toLocaleLowerCase('id-ID').includes(query));
  return <div className={`page-container admin-home ${className}`}>
    <header className="admin-home-heading"><div><p className="admin-eyebrow">Sinar Anugrah / {role}</p><h1>{title}</h1><p>{description}</p></div><label className="admin-search"><LuSearch aria-hidden="true"/><input type="search" aria-label={`Cari menu ${role}`} placeholder="Cari menu atau fitur…" value={search} onChange={e=>setSearch(e.target.value)}/></label></header>
    <div className="admin-home-section"><h2>Ruang kerja {role}</h2><span>{visible.length} modul tersedia</span></div>
    <div className="admin-home-modules">{visible.map(group=>{const Icon=group.icon;return <section className="admin-module-card" key={group.id}><button type="button" className="admin-module-entry" onClick={()=>onNavigate(group.items[0].id)}><span className="admin-module-icon"><Icon aria-hidden="true"/></span><LuArrowUpRight className="admin-module-arrow" aria-hidden="true"/><h2>{group.label}</h2><p>{group.description}</p></button>{group.items.length>1&&<div className="admin-module-features">{group.items.map(item=><button type="button" key={item.id} onClick={()=>onNavigate(item.id)}>{item.label}<span aria-hidden="true">›</span></button>)}</div>}</section>;})}</div>
    {!visible.length&&<div className="admin-empty"><h2>Menu tidak ditemukan</h2><p>{groups.length?'Coba kata kunci yang lebih singkat atau tampilkan semua menu.':'Belum ada menu yang diizinkan untuk akun ini. Hubungi Admin untuk memeriksa akses.'}</p><button type="button" onClick={()=>setSearch('')}>Tampilkan semua menu</button></div>}
  </div>;
}
