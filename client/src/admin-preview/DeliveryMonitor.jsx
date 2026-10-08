import React, { useState } from 'react';
import { LuSearch, LuTruck, LuRadio } from 'react-icons/lu';
import { trips } from './data';
import DeliveryTabs from './DeliveryTabs';
import DeliveryMap from './DeliveryMap';
import TripDetail from './TripDetail';

export default function DeliveryMonitor({ go, openDocs, selectedId, setSelectedId }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Semua');
  const selected = trips.find(t => t.id === selectedId);
  const filtered = trips.filter(t => `${t.id} ${t.driver} ${t.vehicle} ${t.area}`.toLowerCase().includes(query.toLowerCase()) && (status === 'Semua' || t.status === status));
  return <main id="workspace" className="module-workspace monitor-workspace"><div className="page-heading"><div><p className="eyebrow">LOGISTIK</p><h1>Monitor pengiriman</h1><p>Ketahui posisi terakhir, progres tujuan, dan masalah setiap perjalanan.</p></div><span className="monitor-clock"><LuRadio />Simulasi · 8 Okt, 10.24 WIB</span></div><DeliveryTabs page="monitor" go={go} />
    <div className="monitor-overview"><span><strong>4</strong> perjalanan</span><span><i className="dot green" />2 berjalan</span><span><i className="dot orange" />1 perlu perhatian</span><span><i className="dot gray" />1 belum berangkat</span><label>Status<select value={status} onChange={e => setStatus(e.target.value)}>{['Semua', 'Dalam perjalanan', 'Perlu perhatian', 'Belum berangkat'].map(s => <option key={s}>{s}</option>)}</select></label></div>
    <div className="monitor-grid"><section className="trip-list" aria-label="Daftar perjalanan"><label className="search-field"><LuSearch /><input aria-label="Cari perjalanan" placeholder="Driver, mobil, atau perjalanan…" value={query} onChange={e => setQuery(e.target.value)} /></label><div>{filtered.map(t => <button className={`trip-card ${selectedId === t.id ? 'selected' : ''}`} key={t.id} aria-pressed={selectedId === t.id} onClick={() => setSelectedId(t.id)}><span className="trip-card-top"><strong>{t.vehicle}</strong><span>{t.id}</span></span><span className="trip-area">{t.area}</span><span className="trip-driver"><LuTruck />{t.driver}</span><span className="trip-progress"><span style={{ width: `${100 * t.resolved / t.stops.length}%` }} /></span><span className="trip-card-bottom">{t.resolved}/{t.stops.length} stop diproses<span className={t.tone}><i className={`dot ${t.tone}`} />{t.source}</span></span></button>)}</div>{!filtered.length && <div className="empty-state"><h3>Perjalanan tidak ditemukan</h3><button onClick={() => { setStatus('Semua'); setQuery(''); }}>Reset filter</button></div>}</section><DeliveryMap trips={filtered} selected={selected} select={setSelectedId} /></div>
    {!filtered.some(t => t.id === selectedId) && <p className="filter-context">Detail {selectedId} tetap terbuka; perjalanan ini tidak termasuk filter saat ini.</p>}
    <TripDetail trip={selected} openDocs={openDocs} />
    <p className="monitor-footnote">GPS aktif tersedia bila ponsel driver mengirim lokasi dan izin lokasi diberikan. Sumber, waktu pembaruan, serta akurasi harus ditampilkan pada aplikasi nyata.</p>
  </main>;
}
