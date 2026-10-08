import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LuX, LuCheck } from 'react-icons/lu';
import { initialOrders, initialPacking, modules } from './data';
import PreviewHeader from './PreviewHeader';
import PreviewSidebar from './PreviewSidebar';
import PreviewHome from './PreviewHome';
import OrderWorkspace from './OrderWorkspace';
import PackingWorkspace from './PackingWorkspace';
import PackingEditor from './PackingEditor';
import DeliveryMonitor from './DeliveryMonitor';
import RouteWorkspace from './RouteWorkspace';
import ScopeWorkspace from './ScopeWorkspace';
import LeaveDialog from './LeaveDialog';

const pages = ['home', 'orders', 'packing', 'editor', 'monitor', 'routes', 'catalog', 'vehicles', ...modules.map(m => m.id)];
const readPage = () => pages.includes(window.location.hash.slice(1)) ? window.location.hash.slice(1) : 'home';

export default function AdminPreview() {
  const [page, setPage] = useState(readPage);
  const [orders, setOrders] = useState(initialOrders);
  const [documents, setDocuments] = useState(initialPacking);
  const [selectedId, setSelectedId] = useState(initialOrders[2].id);
  const [sourceOrder, setSourceOrder] = useState(null);
  const [editing, setEditing] = useState(null);
  const [sourceTrip, setSourceTrip] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState("TRP-0086");
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(null);
  const [notice, setNotice] = useState('');
  const scrolls = useRef({});
  const content = useRef(null);
  const noticeTimer = useRef(null);
  const orderView = useRef({});
  const saveOrderView = useCallback(view => { orderView.current = view; }, []);
  const routeView = useRef({});
  const saveRouteView = useCallback(view => { routeView.current = view; }, []);
  const notify = useCallback(message => { clearTimeout(noticeTimer.current); setNotice(message); noticeTimer.current = setTimeout(() => setNotice(''), 6500); }, []);
  const transition = useCallback(next => {
    scrolls.current[page] = window.scrollY;
    setPage(next);
  }, [page]);
  const go = next => {
    if (next === 'packing') { setSourceOrder(null); setSourceTrip(null); }
    if (next === page) return;
    if (dirty && page === 'editor') { setPending(next); return; }
    window.location.hash = next;
  };
  useEffect(() => {
    const changed = () => {
      const next = readPage();
      if (dirty && page === 'editor') { window.history.replaceState(null, '', '#editor'); setPending(next); return; }
      transition(next);
    };
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, [dirty, page, transition]);
  useEffect(() => {
    requestAnimationFrame(() => window.scrollTo({ top: scrolls.current[page] || 0, behavior: 'instant' }));
    const title = content.current?.querySelector('h1');
    title?.setAttribute('tabindex', '-1');
    title?.focus({ preventScroll: true });
    document.title = `${page === 'home' ? 'Beranda' : modules.find(m => m.id === page)?.title || 'Packing & pengiriman'} — Pratinjau Admin`;
  }, [page]);
  useEffect(() => {
    const shortcut = e => { if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) { const input = document.querySelector('.search-field input'); if (input) { e.preventDefault(); input.focus(); } } };
    window.addEventListener('keydown', shortcut);
    return () => { window.removeEventListener('keydown', shortcut); clearTimeout(noticeTimer.current); };
  }, []);
  const decide = (id, status, reason) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status, reason, fulfillment: status === 'Disetujui' ? 'Belum dipacking' : 'Tidak diproses' } : o));
    notify(`${id}: ${status.toLowerCase()} pada data contoh.`);
  };
  const edit = (doc, order = null) => { setEditing(doc); setSourceOrder(order); setDirty(false); go('editor'); };
  const save = doc => {
    const next = { ...doc, id: doc.id || `PL-261008-${String(42 + documents.length).padStart(4, '0')}` };
    setDocuments(documents.some(d => d.id === next.id) ? documents.map(d => d.id === next.id ? next : d) : [next, ...documents]);
    setDirty(false); setPage('packing'); setSourceOrder(null); setSourceTrip(null); window.history.pushState(null, '', '#packing');
    notify(`${next.id} ${next.status === 'Dirilis' ? 'dirilis' : 'disimpan'} pada sesi pratinjau. Tidak dikirim ke server.`);
  };
  const openPacking = order => { scrolls.current[page] = window.scrollY; setSourceOrder(order); setSourceTrip(null); setPage('packing'); window.history.pushState(null, '', '#packing'); };
  const openTripDocs = trip => { scrolls.current[page] = window.scrollY; setSourceOrder(null); setSourceTrip(trip); setPage('packing'); window.history.pushState(null, '', '#packing'); };
  const openTrip = id => { setSelectedTripId(id); go("monitor"); };
  const current = ['editor', 'monitor', 'routes', 'vehicles'].includes(page) ? 'Packing & pengiriman' : modules.find(m => m.id === page)?.title || 'Order';
  return <div className={`admin-preview ${page === 'home' ? 'is-home' : ''}`}><PreviewHeader current={current} go={go} home={page === 'home'} /><div className="preview-body">{page !== 'home' && <PreviewSidebar page={page} go={go} />}<div className="preview-content" ref={content}>
    {page === 'home' && <PreviewHome go={go} />}
    {page === 'orders' && <OrderWorkspace orders={orders} selectedId={selectedId} selectOrder={setSelectedId} decide={decide} go={go} notify={notify} openPacking={openPacking} initialView={orderView.current} saveView={saveOrderView} />}
    {page === 'packing' && <PackingWorkspace documents={documents} go={go} edit={edit} sourceOrder={sourceOrder} sourceTrip={sourceTrip} openTrip={openTrip} />}
    {page === 'editor' && <PackingEditor document={editing} sourceOrder={sourceOrder} orders={orders} save={save} go={go} setDirty={setDirty} />}
    {page === 'monitor' && <DeliveryMonitor go={go} openDocs={openTripDocs} selectedId={selectedTripId} setSelectedId={setSelectedTripId} />}
    {page === 'routes' && <RouteWorkspace documents={documents} go={go} notify={notify} initialView={routeView.current} saveView={saveRouteView} />}
    {['outlets', 'sales', 'followup', 'reports', 'system', 'catalog', 'vehicles'].includes(page) && <ScopeWorkspace key={page} page={page} go={go} />}
  </div></div><LeaveDialog open={pending !== null} stay={() => setPending(null)} leave={() => { setDirty(false); setPending(null); setPage(pending); window.location.hash = pending; }} />
    {notice && <div className="toast" role="status"><LuCheck /><span>{notice}</span><button className="icon-button" onClick={() => setNotice('')} aria-label="Tutup pemberitahuan"><LuX /></button></div>}
  </div>;
}
