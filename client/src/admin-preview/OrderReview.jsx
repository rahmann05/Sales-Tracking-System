import React, { useEffect, useRef, useState } from 'react';
import { LuX, LuArrowUpRight, LuCheck, LuCircleAlert } from 'react-icons/lu';
import { products, rupiah } from './data';
import StatusBadge from './StatusBadge';

export default function OrderReview({ order, close, decide, openPacking }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(max-width: 1250px)').matches) ref.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [order.id]);
  const submitRejection = () => {
    if (!reason.trim()) { setError('Tuliskan alasan penolakan order.'); return; }
    decide(order.id, 'Ditolak', reason); setRejecting(false); setReason('');
  };
  return <aside ref={ref} className="detail-panel" aria-label={`Pemeriksaan ${order.id}`} key={order.id}>
    <div className="detail-heading"><span>PEMERIKSAAN ORDER</span><button className="icon-button" aria-label="Tutup detail order" onClick={close}><LuX /></button></div>
    <div className="detail-body"><div className="detail-intro"><StatusBadge>{order.status}</StatusBadge><h2>{order.id}</h2><p>{order.outlet}</p><small>Masuk 8 Oktober 2026, {order.time}</small></div>
    <dl className="key-values"><div><dt>Sales</dt><dd>{order.sales}</dd></div><div><dt>Wilayah</dt><dd>Cimahi Selatan</dd></div><div><dt>Ketentuan order</dt><dd>Tempo 14 hari</dd></div><div><dt>Jadwal kirim</dt><dd>9 Oktober 2026</dd></div></dl>
    <section className="detail-section"><h3>Penugasan pemeriksaan</h3><dl className="key-values review-assignment"><div><dt>Pemeriksa</dt><dd>Admin operasional</dd></div><div><dt>Tenggat contoh</dt><dd>8 Okt · 10.00 WIB</dd></div></dl>{order.status === "Menunggu" && <StatusBadge tone="orange">Lewat tenggat · 24 menit</StatusBadge>}</section>
    <section className="detail-section"><h3>Rincian barang <span>{products.length} baris</span></h3>{products.map(p => <div className="product-line" key={p.sku}><div><strong>{p.name}</strong><small>{p.quantity} {p.unit} × {rupiah(p.price)}</small></div><span>{rupiah(p.quantity * p.price)}</span></div>)}<div className="order-total"><span>Total order</span><strong>{rupiah(order.value)}</strong></div><small className="muted">Harga contoh sudah termasuk pajak.</small></section>
    <section className="detail-section"><h3>Pemenuhan</h3><p>{order.fulfillment}</p>{order.status === 'Disetujui' ? <button className="linked-document" onClick={() => openPacking(order)}><span>Siapkan / buka packing terkait<small>Identitas order dibawa ke dokumen</small></span><LuArrowUpRight /></button> : <p className="muted">Packing dapat disiapkan setelah order disetujui.</p>}</section>
    <section className="detail-section"><h3>Catatan pembayaran eksternal</h3><p className="muted">Belum ada catatan. Pencatatan bersifat opsional.</p></section>
    <section className="detail-section"><h3>Riwayat</h3><ol className="history-list"><li><span /><div><strong>Order diajukan oleh {order.sales}</strong><small>8 Okt · {order.time} · Kunjungan outlet</small></div></li>{order.status !== 'Menunggu' && <li><span /><div><strong>{order.status === 'Disetujui' ? 'Order disetujui' : 'Order ditolak'}</strong><small>{order.reason || 'Admin · Data contoh'}</small></div></li>}</ol></section>
    </div>
    {order.status === 'Menunggu' && <div className="detail-decision">{rejecting ? <><label>Alasan penolakan<textarea value={reason} onChange={e => { setReason(e.target.value); setError(''); }} placeholder="Contoh: data order belum lengkap…" /></label>{error && <p className="field-error" role="alert"><LuCircleAlert />{error}</p>}<div className="button-row"><button className="secondary" onClick={() => setRejecting(false)}>Batal</button><button className="primary" onClick={submitRejection}>Konfirmasi penolakan</button></div></> : <><p>Pastikan outlet, barang, dan ketentuan order sesuai.</p><div className="button-row"><button className="secondary" onClick={() => setRejecting(true)}>Tolak order</button><button className="primary" onClick={() => decide(order.id, 'Disetujui')}><LuCheck />Setujui order</button></div></>}</div>}
  </aside>;
}
