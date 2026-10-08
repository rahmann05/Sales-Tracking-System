import React from 'react';
import { LuArrowUpRight, LuChevronRight, LuLayoutGrid } from 'react-icons/lu';

export default function PreviewHeader({ current, go, home }) {
  return <header className="preview-header">
    <a className="brand" href="#home"><span className="brand-mark">sa<span>.</span></span><span>Sinar Anugrah<small>Ruang kerja admin</small></span></a>
    {!home && <nav aria-label="Lokasi halaman" className="breadcrumbs"><button onClick={() => go('home')}><LuLayoutGrid />Beranda</button><LuChevronRight /><span>{current}</span></nav>}
    <div className="header-end"><span className="preview-label"><span />Pratinjau desain · data contoh</span><span className="account-avatar" aria-label="Akun contoh Admin">AD</span></div>
    <a className="skip-link" href="#workspace" onClick={e => { e.preventDefault(); const main = document.getElementById("workspace"); main?.setAttribute("tabindex", "-1"); main?.focus(); }}>Lewati navigasi <LuArrowUpRight /></a>
  </header>;
}
