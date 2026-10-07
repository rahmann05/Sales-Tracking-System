import React, { useEffect, useState } from 'react';
import { deliveryApi, outletsApi } from '../../../services/api';
export function PackingDraftForm({ document, order, onSaved, onCancel }) {
  const [outlet, setOutlet] = useState(document?.outlet || order?.pjpStop?.outlet || null);
  const [search, setSearch] = useState(''); const [outlets, setOutlets] = useState([]);
  const [items, setItems] = useState(document?.items || order?.items.map(i => ({ lineId: i.id, sku: i.product?.sku || '', name: i.product?.name || '', quantity: i.quantity, unit: 'unit' })) || []);
  const [invoices, setInvoices] = useState(document?.invoices.map(({invoiceNumber,totalCartons,totalAmount}) => ({invoiceNumber,totalCartons,totalAmount})) || []);
  const [cartons, setCartons] = useState(document?.totalCartons || 0); const [weight, setWeight] = useState(document?.totalWeight || 0);
  const [notes, setNotes] = useState(document?.notes || ''); const [reason, setReason] = useState(document?.overrideReason || '');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (search.length < 2) { setOutlets([]); return; }
    let active = true;
    const timer = setTimeout(() => outletsApi.getAll({ search, limit: 20 }).then(r => { if (active) { const d = r.data; setOutlets(Array.isArray(d) ? d : d?.data || d?.outlets || []); } }).catch(e => { if (active) setError(e.message); }), 300);
    return () => { active = false; clearTimeout(timer); };
  }, [search]);
  const sourceOrderId = document?.sourceOrderId || order?.id || null;
  const save = async e => {
    e.preventDefault(); if (busy) return; setBusy(true); setError('');
    try {
      const data = { outletId: outlet?.id, sourceOrderId, items, invoices: invoices.map(i => ({ ...i, totalAmount: i.totalAmount === '' || i.totalAmount == null ? undefined : Number(i.totalAmount) })), totalCartons: Number(cartons), totalWeight: Number(weight), notes, overrideReason: reason, ...(document ? { revision: document.revision } : {}) };
      if (document) await deliveryApi.updatePackingList(document.id, data); else await deliveryApi.createPackingList(data);
      onSaved();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <form onSubmit={save} className="rounded-2xl border border-primary/30 bg-surface p-4 space-y-4">
    <h2 className="text-lg font-semibold">{document ? `Edit ${document.code}` : 'Draft packing list admin'}</h2>
    <p className="text-sm">{sourceOrderId ? `Referensi order: ${sourceOrderId}` : 'Input manual tanpa order sales'}. Data ini tidak mengubah approval atau penjualan order.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <fieldset disabled={busy} className="space-y-4">
      {outlet ? <p>Toko: <strong>{outlet.name}</strong> {!sourceOrderId && !document && <button type="button" className="underline ml-3" onClick={() => setOutlet(null)}>Ganti</button>}</p> : <div><label className="block">Cari toko<input className="form-input w-full" value={search} onChange={e => setSearch(e.target.value)} placeholder="Minimal 2 huruf" /></label>{outlets.map(o => <button type="button" className="block w-full text-left border-b p-2" key={o.id} onClick={() => { setOutlet(o); setSearch(''); }}>{o.name} · {o.address}</button>)}</div>}
      <div className="flex justify-between items-center"><h3 className="font-semibold">Rincian barang</h3><button type="button" className="border rounded-lg px-3 py-2" onClick={() => setItems([...items,{ name:'',sku:'',unit:'unit',quantity:1 }])}>Tambah barang</button></div>
      {items.map((item,index) => <div key={item.lineId || index} className="grid grid-cols-2 md:grid-cols-6 gap-2 border-b pb-3">{[['sku','SKU (opsional)'],['name','Nama barang'],['unit','Satuan'],['quantity','Jumlah']].map(([key,label]) => <label className={`text-sm ${key === 'name' ? 'md:col-span-2' : ''}`} key={key}>{label}<input className="form-input w-full" required={key !== 'sku'} type={key === 'quantity' ? 'number' : 'text'} min="1" step="1" value={item[key]} onChange={e => setItems(items.map((v,i) => i === index ? {...v,[key]:key === 'quantity' ? Number(e.target.value) : e.target.value} : v))}/></label>)}<button type="button" aria-label={`Hapus barang ${index+1}`} onClick={() => setItems(items.filter((_,i) => i !== index))}>Hapus</button></div>)}
      <div className="grid grid-cols-2 gap-3"><label>Total karton<input type="number" min="0" step="1" className="form-input w-full" value={cartons} onChange={e => setCartons(e.target.value)}/></label><label>Berat total (kg)<input type="number" min="0" step="0.01" className="form-input w-full" value={weight} onChange={e => setWeight(e.target.value)}/></label></div>
      <p className="text-sm text-on-surface-variant">Jumlah produk mengikuti satuan pada baris barang. Isi karton sesuai kemasan fisik; tidak dihitung otomatis dari unit produk. Draft boleh belum lengkap.</p>
      <div className="flex justify-between"><h3 className="font-semibold">Faktur</h3><button type="button" onClick={() => setInvoices([...invoices,{invoiceNumber:'',totalCartons:1,totalAmount:''}])}>Tambah faktur</button></div>
      {invoices.map((inv,index) => <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-2">{[['invoiceNumber','Nomor faktur'],['totalCartons','Karton faktur'],['totalAmount','Nominal (opsional)']].map(([key,label]) => <label className="text-sm" key={key}>{label}<input className="form-input w-full" required={key !== 'totalAmount'} type={key === 'invoiceNumber' ? 'text' : 'number'} min={key === 'totalCartons' ? 1 : 0} value={inv[key] ?? ''} onChange={e => setInvoices(invoices.map((v,i) => i === index ? {...v,[key]:key === 'totalCartons' ? Number(e.target.value) : e.target.value} : v))}/></label>)}<button type="button" onClick={() => setInvoices(invoices.filter((_,i) => i !== index))}>Hapus faktur</button></div>)}
      {sourceOrderId && <label className="block">Alasan override (wajib untuk order pending)<textarea className="form-input w-full" value={reason} onChange={e => setReason(e.target.value)}/></label>}
      <label className="block">Catatan<textarea className="form-input w-full" value={notes} onChange={e => setNotes(e.target.value)}/></label>
      <div className="flex justify-end gap-3"><button type="button" onClick={onCancel}>Batal</button><button disabled={!outlet} className="bg-primary text-on-primary rounded-xl px-4 py-2" type="submit">{busy ? 'Menyimpan...' : 'Simpan dokumen'}</button></div>
    </fieldset>
  </form>;
}
