import React, { useState } from 'react';
import { LuArrowUpRight, LuSearch, LuX } from 'react-icons/lu';
import { modules } from './data';

export default function PreviewHome({ go }) {
  const [query, setQuery] = useState('');
  const visible = modules.filter(m => `${m.title} ${m.description} ${m.links}`.toLowerCase().includes(query.toLowerCase()));
  return <main id="workspace" className="home-workspace">
    <div className="home-heading"><div><h1>Ruang kerja admin</h1><p>Pilih modul untuk mulai bekerja.</p></div><span className="home-date">Kamis, 8 Oktober 2026</span></div>
    <div className="home-toolbar"><h2>Modul aplikasi <span>07</span></h2><label className="search-field"><LuSearch /><input aria-label="Cari modul admin" placeholder="Cari modul atau fitur…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button onClick={() => setQuery('')} aria-label="Hapus pencarian"><LuX /></button>}<kbd>/</kbd></label></div>
    <div className="module-grid">{visible.map(m => <button className="module-card" key={m.id} onClick={() => go(m.id)}><span className={`module-icon ${m.tone}`}><m.icon /></span><LuArrowUpRight className="module-arrow" /><h3>{m.title}</h3><p>{m.description}</p><span className="module-links">{m.links}</span></button>)}</div>
    {!visible.length && <div className="empty-state"><h3>Modul tidak ditemukan</h3><p>Coba kata “order”, “kunjungan”, atau “pengguna”.</p><button onClick={() => setQuery('')}>Tampilkan semua modul</button></div>}
    <p className="home-footnote">Satu ruang kerja untuk setiap proses. Akses fitur mengikuti peran dan izin pengguna.</p>
  </main>;
}
