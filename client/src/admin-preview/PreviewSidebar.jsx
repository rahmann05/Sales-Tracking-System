import React from 'react';
import { LuLayoutGrid, LuChevronRight } from 'react-icons/lu';
import { modules } from './data';

export default function PreviewSidebar({ page, go }) {
  const active = ['editor', 'monitor', 'routes'].includes(page) ? 'packing' : page;
  return <aside className="preview-sidebar"><nav aria-label="Modul admin">
    <button onClick={() => go('home')}><LuLayoutGrid /><span>Beranda</span></button>
    <span className="sidebar-label">RUANG KERJA</span>
    {modules.map(m => <button key={m.id} aria-current={active === m.id ? 'page' : undefined} onClick={() => go(m.id)}><m.icon /><span>{m.title}</span>{active === m.id && <LuChevronRight className="nav-chevron" />}</button>)}
  </nav><div className="sidebar-footer"><span className="workspace-dot" />Sinar Anugrah<small>Admin · Seluruh wilayah</small></div></aside>;
}
