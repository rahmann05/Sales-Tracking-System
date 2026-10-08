import React, { useEffect, useMemo, useState } from 'react';
import { LuSearch, LuChevronLeft, LuChevronRight, LuRotateCw, LuSlidersHorizontal } from 'react-icons/lu';
import { orderStates, rupiah, salesNames } from './data';
import StatusBadge from './StatusBadge';
import OrderReview from './OrderReview';

export default function OrderWorkspace({ orders, selectedId, selectOrder, decide, go, notify, openPacking, initialView, saveView }) {
  const [status, setStatus] = useState(initialView.status || 'Semua');
  const [query, setQuery] = useState(initialView.query || '');
  const [sales, setSales] = useState(initialView.sales || 'Semua sales');
  const [filters, setFilters] = useState(initialView.filters || false);
  const [page, setPage] = useState(initialView.page || 0);
  useEffect(() => saveView({ status, query, sales, filters, page }), [status, query, sales, filters, page, saveView]);
  const filtered = useMemo(() => orders.filter(o => (status === 'Semua' || o.status === status) && (sales === 'Semua sales' || o.sales === sales) && `${o.id} ${o.outlet} ${o.sales}`.toLowerCase().includes(query.toLowerCase())), [orders, status, query, sales]);
  const selected = orders.find(o => o.id === selectedId);
  const reset = () => { setQuery(''); setStatus('Semua'); setSales('Semua sales'); setPage(0); };
  return <main id="workspace" className="module-workspace">
    <div className="page-heading"><div><p className="eyebrow">PENJUALAN</p><h1>Order</h1><p>Periksa pesanan masuk dan telusuri proses pemenuhannya.</p></div><button className="secondary" onClick={() => notify('Data contoh ditampilkan kembali. Tidak terhubung ke server.')}><LuRotateCw />Muat ulang</button></div>
    <div className="section-tabs" aria-label="Fitur Order"><button aria-current="page">Daftar order</button><button onClick={() => go('catalog')}>Katalog produk</button></div>
    <div className="work-split">
      <section className="list-panel" aria-label="Daftar order">
        <div className="status-tabs" aria-label="Filter status order">{['Semua', ...orderStates].map(s => <button key={s} aria-pressed={status === s} onClick={() => { setStatus(s); setPage(0); }}>{s}<span>{s === 'Semua' ? orders.length : orders.filter(o => o.status === s).length}</span></button>)}</div>
        <div className="list-toolbar"><label className="search-field"><LuSearch /><input aria-label="Cari order" placeholder="Cari nomor, outlet, atau sales…" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} /></label><button className="secondary" aria-expanded={filters} onClick={() => setFilters(!filters)}><LuSlidersHorizontal />Filter{sales !== 'Semua sales' && <span className="filter-dot" />}</button></div>
        {filters && <div className="filter-bar"><label>Sales<select value={sales} onChange={e => { setSales(e.target.value); setPage(0); }}>{['Semua sales', ...salesNames].map(s => <option key={s}>{s}</option>)}</select></label><span>Periode contoh: 8 Oktober 2026</span><button className="text-button" onClick={reset}>Reset filter</button></div>}
        <div className="table-scroll"><table className="data-table order-table"><thead><tr><th>Order / outlet</th><th>Sales</th><th className="numeric">Nilai order</th><th>Status / pemenuhan</th><th><span className="sr-only">Buka detail</span></th></tr></thead><tbody>{filtered.slice(page * 10, page * 10 + 10).map(o => <tr key={o.id} className={selectedId === o.id ? 'selected' : ''}><td><button className="row-link" onClick={() => selectOrder(o.id)}>{o.id}</button><span className="cell-outlet">{o.outlet}</span><small>8 Okt · {o.time}</small></td><td>{o.sales}</td><td className="numeric">{rupiah(o.value)}</td><td><StatusBadge>{o.status}</StatusBadge><small>{o.fulfillment}</small></td><td><button className="icon-button" aria-label={`Periksa ${o.id}`} onClick={() => selectOrder(o.id)}><LuChevronRight /></button></td></tr>)}</tbody></table></div>
        {!filtered.length && <div className="empty-state"><h3>Tidak ada order yang sesuai</h3><p>Ubah kata pencarian atau filter yang dipilih.</p><button onClick={reset}>Reset pencarian dan filter</button></div>}
        <div className="pagination"><span>{filtered.length ? page * 10 + 1 : 0}–{Math.min(page * 10 + 10, filtered.length)} dari {filtered.length} order</span><div><button className="icon-button" aria-label="Halaman order sebelumnya" disabled={!page} onClick={() => setPage(page - 1)}><LuChevronLeft /></button><span>{page + 1} / {Math.max(1, Math.ceil(filtered.length / 10))}</span><button className="icon-button" aria-label="Halaman order berikutnya" disabled={(page + 1) * 10 >= filtered.length} onClick={() => setPage(page + 1)}><LuChevronRight /></button></div></div>
      </section>
      {selected && <OrderReview key={selected.id} order={selected} decide={decide} close={() => selectOrder(null)} openPacking={openPacking} />}
    </div>
  </main>;
}
