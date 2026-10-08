import React, { useEffect, useState } from 'react';
import { LuArrowLeft, LuCheck, LuPlus, LuTrash2, LuCircleAlert } from 'react-icons/lu';
import { products, outlets } from './data';
import PackingReviewDialog from './PackingReviewDialog';
import StatusBadge from './StatusBadge';

export default function PackingEditor({ document: doc, sourceOrder, orders, save, go, setDirty }) {
  const [orderId, setOrderId] = useState(doc?.orderId || sourceOrder?.id || '');
  const [outlet, setOutlet] = useState(doc?.outlet || sourceOrder?.outlet || '');
  const [items, setItems] = useState(doc?.items || products.map(p => ({ ...p })));
  const [cartons, setCartons] = useState(doc?.cartons || 0);
  const [weight, setWeight] = useState(doc?.weight || '');
  const [invoices, setInvoices] = useState(doc?.invoices || [{ number: '', cartons: 0 }]);
  const [notes, setNotes] = useState(doc?.notes || '');
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const readOnly = Boolean(doc && doc.status !== 'Draft');
  const invoiceCartons = invoices.reduce((sum, i) => sum + Number(i.cartons), 0);
  const balanced = Number(cartons) > 0 && invoiceCartons === Number(cartons);
  const mark = () => { setDirty(true); setError(''); };
  useEffect(() => {
    if (error) {
      const summary = document.querySelector('.error-banner');
      summary?.focus(); summary?.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [error]);
  useEffect(() => {
    const warn = e => { e.preventDefault(); e.returnValue = ''; };
    // The parent owns navigation prompts; browser reload protection applies after edits.
    const change = () => window.addEventListener('beforeunload', warn);
    const form = document.getElementById('packing-editor');
    form?.addEventListener('input', change, { once: true });
    return () => { form?.removeEventListener('input', change); window.removeEventListener('beforeunload', warn); };
  }, []);
  const chooseOrder = id => {
    const order = orders.find(o => o.id === id);
    setOrderId(id); setOutlet(order?.outlet || ''); mark();
  };
  const validation = () => {
    if (!outlet) return 'Pilih outlet tujuan pada bagian Identitas dokumen.';
    if (!items.length || items.some(i => !i.name.trim() || !i.unit.trim() || Number(i.quantity) <= 0)) return 'Lengkapi nama, satuan, dan jumlah lebih dari nol pada setiap barang.';
    if (Number(cartons) <= 0 || !Number.isInteger(Number(cartons))) return 'Total karton fisik harus bilangan bulat lebih dari nol.';
    if (Number(weight) < 0) return 'Berat muatan tidak boleh negatif.';
    if (!invoices.length || invoices.some(i => !i.number.trim() || Number(i.cartons) <= 0 || !Number.isInteger(Number(i.cartons)))) return 'Lengkapi nomor faktur dan jumlah karton bilangan bulat lebih dari nol.';
    if (new Set(invoices.map(i => i.number.trim().toLowerCase())).size !== invoices.length) return 'Nomor faktur tidak boleh berulang.';
    if (!balanced) return 'Jumlah karton pada faktur harus sama dengan karton fisik.';
    return '';
  };
  const payload = status => ({ ...doc, id: doc?.id || '', orderId, outlet, cartons: Number(cartons), weight, items, invoices, notes, status, trip: doc?.trip || 'Belum dialokasikan' });
  const submit = e => {
    e.preventDefault(); const message = validation(); setError(message);
    if (!message) save(payload('Draft'));
  };
  const requestRelease = () => { const message = validation(); setError(message); if (!message) setReview(true); };
  return <main id="workspace" className="module-workspace editor-workspace">
    <button className="back-link" onClick={() => go('packing')}><LuArrowLeft />Packing list</button>
    <div className="page-heading"><div><p className="eyebrow">DOKUMEN MUATAN</p><h1>{doc ? doc.id : 'Packing list baru'}</h1><p>{readOnly ? 'Dokumen telah dirilis. Rincian ditampilkan untuk pemeriksaan.' : 'Lengkapi dokumen, periksa karton, lalu simpan atau rilis.'}</p></div><StatusBadge>{doc?.status || 'Draft'}</StatusBadge></div>
    <form id="packing-editor" onSubmit={submit} noValidate>
      {error && <div className="error-banner" role="alert" tabIndex={-1}><LuCircleAlert /><span>{error}</span></div>}
      <fieldset disabled={readOnly} className="editor-fields">
        <section className="form-section"><div className="section-heading"><span className="step-number">1</span><div><h2>Identitas dokumen</h2><p>Sumber order dan outlet tujuan pengiriman.</p></div></div><div className="field-grid"><label>Sumber order<select value={orderId} onChange={e => chooseOrder(e.target.value)}><option value="">Manual · tanpa sumber order</option>{orders.filter(o => o.status === 'Disetujui' || o.id === orderId).map(o => <option key={o.id} value={o.id}>{o.id} · {o.outlet}</option>)}</select><small>Mode manual mengikuti pengaturan dan izin pada aplikasi.</small></label><label>Outlet tujuan <span className="required">*</span><select value={outlet} disabled={Boolean(orderId) || readOnly} onChange={e => { setOutlet(e.target.value); mark(); }}><option value="">Pilih outlet</option>{outlets.map(o => <option key={o}>{o}</option>)}</select><small>{orderId ? 'Mengikuti outlet pada order sumber.' : 'Pilih pelanggan penerima muatan.'}</small></label></div></section>
        <section className="form-section"><div className="section-heading"><span className="step-number">2</span><div><h2>Barang yang dikirim</h2><p>Jumlah dan satuan barang pada dokumen ini.</p></div></div><div className="table-scroll"><table className="data-table editor-table"><thead><tr><th>SKU / nama barang</th><th>Jumlah</th><th>Satuan</th><th><span className="sr-only">Hapus</span></th></tr></thead><tbody>{items.map((p, index) => <tr key={`${p.sku}-${index}`}><td><strong>{p.sku}</strong><input aria-label={`Nama barang ${index + 1}`} value={p.name} onChange={e => { setItems(items.map((v, j) => j === index ? { ...v, name: e.target.value } : v)); mark(); }} /></td><td><input aria-label={`Jumlah barang ${index + 1}`} type="number" min="0.01" step="any" value={p.quantity} onChange={e => { setItems(items.map((v, j) => j === index ? { ...v, quantity: e.target.value } : v)); mark(); }} /></td><td><input aria-label={`Satuan barang ${index + 1}`} value={p.unit} onChange={e => { setItems(items.map((v, j) => j === index ? { ...v, unit: e.target.value } : v)); mark(); }} /></td><td><button type="button" className="icon-button danger" aria-label={`Hapus barang ${index + 1}`} onClick={() => { setItems(items.filter((_, j) => j !== index)); mark(); }}><LuTrash2 /></button></td></tr>)}</tbody></table></div>{!readOnly && <button type="button" className="text-button add-row" onClick={() => { setItems([...items, { sku: 'BARU', name: '', quantity: 1, unit: '' }]); mark(); }}><LuPlus />Tambah baris barang</button>}</section>
        <section className="form-section"><div className="section-heading"><span className="step-number">3</span><div><h2>Kemasan & faktur</h2><p>Samakan total karton fisik dengan pembagian pada faktur.</p></div></div><div className="field-grid"><label>Total karton fisik <span className="required">*</span><input type="number" min="1" value={cartons} onChange={e => { setCartons(e.target.value); mark(); }} /></label><label>Berat muatan (kg)<input type="number" min="0" value={weight} onChange={e => { setWeight(e.target.value); mark(); }} placeholder="Opsional" /></label></div><div className="invoice-list">{invoices.map((i, index) => <div className="invoice-row" key={index}><label>Nomor faktur {index + 1} <span className="required">*</span><input placeholder="Contoh: INV-261008-0042" value={i.number} onChange={e => { setInvoices(invoices.map((v, j) => j === index ? { ...v, number: e.target.value } : v)); mark(); }} /></label><label>Karton <span className="required">*</span><input type="number" min="1" value={i.cartons} onChange={e => { setInvoices(invoices.map((v, j) => j === index ? { ...v, cartons: e.target.value } : v)); mark(); }} /></label><button type="button" className="icon-button danger" aria-label={`Hapus faktur ${index + 1}`} onClick={() => { setInvoices(invoices.filter((_, j) => j !== index)); mark(); }}><LuTrash2 /></button></div>)}</div><div className="invoice-footer">{!readOnly && <button type="button" className="text-button" onClick={() => { setInvoices([...invoices, { number: '', cartons: 0 }]); mark(); }}><LuPlus />Tambah faktur</button>}<span className={`balance-note ${balanced ? 'balanced' : ''}`}>{balanced && <LuCheck />}{invoiceCartons} / {cartons || 0} karton pada faktur{balanced ? ' · Sesuai' : ' · Belum sesuai'}</span></div></section>
        <section className="form-section"><div className="section-heading"><span className="step-number">4</span><div><h2>Catatan gudang</h2><p>Instruksi penanganan yang perlu diketahui kepala gudang.</p></div></div><label>Catatan tambahan<textarea value={notes} onChange={e => { setNotes(e.target.value); mark(); }} placeholder="Contoh: pisahkan kemasan untuk dua faktur. (Opsional)" /></label></section>
      </fieldset>
      <div className="editor-actions"><div><strong>{items.length} baris barang · {cartons || 0} karton</strong><small>{readOnly ? 'Dokumen telah dirilis' : 'Draft belum menjadi penugasan pengiriman.'}</small></div><div className="button-row"><button type="button" className="secondary" onClick={() => go('packing')}>{readOnly ? 'Kembali ke daftar' : 'Batal'}</button>{!readOnly && <><button type="submit" className="secondary">Simpan draft</button><button type="button" className="primary" onClick={requestRelease}>Periksa & rilis</button></>}</div></div>
    </form>
    <PackingReviewDialog open={review} close={() => setReview(false)} release={() => { setReview(false); save(payload('Dirilis')); }} outlet={outlet} cartons={cartons} invoices={invoices.length} orderId={orderId} />
  </main>;
}
