import React from 'react';
import { LuArrowUpRight } from 'react-icons/lu';
import { modules } from './data';

export default function PreviewHome({ go }) {
  return (
    <main id="workspace" className="home-workspace">
      <div className="home-heading">
        <div>
          <h1>Ruang kerja admin</h1>
          <p>Pilih modul untuk mulai bekerja.</p>
        </div>
        <span className="home-date">Kamis, 8 Oktober 2026</span>
      </div>
      <div className="home-toolbar">
        <h2>
          Modul aplikasi <span>07</span>
        </h2>
      </div>
      <div className="module-grid">
        {modules.map((m) => (
          <button className="module-card" key={m.id} onClick={() => go(m.id)}>
            <span className={`module-icon ${m.tone}`}>
              <m.icon />
            </span>
            <LuArrowUpRight className="module-arrow" />
            <h3>{m.title}</h3>
            <p>{m.description}</p>
            <span className="module-links">{m.links}</span>
          </button>
        ))}
      </div>
      <p className="home-footnote">
        Satu ruang kerja untuk setiap proses. Akses fitur mengikuti peran dan izin pengguna.
      </p>
    </main>
  );
}
