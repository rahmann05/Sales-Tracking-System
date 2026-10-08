import React, { useState } from 'react';
import { LuPlus, LuSearch, LuChevronRight, LuFileText } from 'react-icons/lu';
import DeliveryTabs from './DeliveryTabs';
import StatusBadge from './StatusBadge';

export default function PackingWorkspace({ documents, go, edit, sourceOrder, sourceTrip, openTrip }) {
  const [status, setStatus] = useState('Semua');
  const [query, setQuery] = useState('');
  const filtered = documents.filter(d => (!sourceOrder || d.orderId === sourceOrder.id) && (!sourceTrip || d.trip === sourceTrip.id) && (status === 'Semua' || d.status === status) && `${d.id} ${d.outlet} ${d.orderId}`.toLowerCase().includes(query.toLowerCase()));
  return <main id="workspace" className="module-workspace"><div className="page-heading"><div><p className="eyebrow">LOGISTIK</p><h1>Packing list</h1><p>Siapkan dokumen muatan sebelum dialokasikan ke perjalanan.</p></div><button className="primary" onClick={() => edit(null, sourceOrder)}><LuPlus />Buat packing list</button></div><DeliveryTabs page="packing" go={go} />
    {sourceOrder && <div className="context-strip"><LuFileText /><span>Dokumen terkait <strong>{sourceOrder.id}</strong> · {sourceOrder.outlet}</span><button className="text-button" onClick={() => go('packing')}>Lihat semua dokumen</button></div>}
    {sourceTrip && <div className="context-strip"><LuFileText /><span>Muatan perjalanan <strong>{sourceTrip.id}</strong> · {sourceTrip.vehicle}</span><button className="text-button" onClick={() => go("packing")}>Lihat semua dokumen</button></div>}
    <section className="list-panel"><div className="status-tabs" aria-label="Status packing">{['Semua', 'Draft', 'Dirilis', 'Dalam perjalanan'].map(s => <button key={s} aria-pressed={status === s} onClick={() => setStatus(s)}>{s}<span>{documents.filter(d => (!sourceOrder || d.orderId === sourceOrder.id) && (!sourceTrip || d.trip === sourceTrip.id) && (s === 'Semua' || d.status === s)).length}</span></button>)}</div>
      <div className="list-toolbar"><label className="search-field"><LuSearch /><input aria-label="Cari packing list" placeholder="Cari dokumen, order, atau outlet…" value={query} onChange={e => setQuery(e.target.value)} /></label><span className="muted">8 Oktober 2026</span></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Dokumen / sumber order</th><th>Outlet tujuan</th><th className="numeric">Karton</th><th>Status</th><th>Perjalanan</th><th><span className="sr-only">Buka dokumen</span></th></tr></thead><tbody>{filtered.map(d => <tr key={d.id}><td><button className="row-link" onClick={() => edit(d)}>{d.id}</button><small>{d.orderId || 'Dokumen manual'}</small></td><td className="outlet-column">{d.outlet}</td><td className="numeric">{d.cartons}</td><td><StatusBadge>{d.status}</StatusBadge></td><td>{d.trip === 'Belum dialokasikan' ? <span className="muted">Belum dialokasikan</span> : <button className="row-link" onClick={() => openTrip(d.trip)}>{d.trip}</button>}</td><td><button className="icon-button" aria-label={`Buka ${d.id}`} onClick={() => edit(d)}><LuChevronRight /></button></td></tr>)}</tbody></table></div>
      {!filtered.length && <div className="empty-state"><h3>Belum ada dokumen yang sesuai</h3><p>{sourceOrder ? 'Buat packing list dari order ini untuk melanjutkan pemenuhan.' : 'Ubah pencarian atau pilih status lain.'}</p><button onClick={() => { setQuery(''); setStatus('Semua'); }}>Reset filter</button></div>}
      <div className="pagination"><span>{filtered.length} dokumen ditampilkan</span><span>Jumlah karton adalah kemasan pengiriman.</span></div>
    </section></main>;
}
