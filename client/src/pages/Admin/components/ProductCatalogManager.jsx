import {useFeaturePolicy} from '../../../shared/hooks/useFeaturePolicy';
import React, { useState, useEffect } from 'react';
import {unitDescription} from '../../../../../shared/product-units.mjs';
import { productsApi } from '../../../services/api';
import { ProductForm } from '../../../shared/components/common/ProductForm';

export function ProductCatalogManager() {
  const featurePolicy=useFeaturePolicy('PRODUCTS');
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true); setError('');
    try { setProducts((await productsApi.getAll()).data || []); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  useEffect(() => { load(); }, []);
  const remove = async product => {
    if (!window.confirm(`Nonaktifkan ${product.name} dari katalog? Riwayat transaksi tetap tersimpan.`)) return;
    setBusy(true);
    try { await productsApi.remove(product.id); setProducts(prev => prev.filter(p => p.id !== product.id)); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <section className="bg-surface rounded-2xl border border-border-glass p-4 sm:p-5 space-y-4">
    <div className="flex flex-wrap justify-between items-start gap-3"><div><h2 className="font-bold text-lg">Katalog produk / SKU</h2><p className="text-sm text-on-surface-variant">Kelola produk untuk order dan hasil kunjungan. Izin penambahan oleh sales ada di Kebijakan Operasional.</p></div><button className="btn btn-primary min-h-11" disabled={!featurePolicy.canStart} title={featurePolicy.reason} onClick={() => setEditing(null)}>Tambah produk</button></div>
    {editing !== undefined && <ProductForm key={editing?.id || 'new'} product={editing} onCancel={() => setEditing(undefined)} onSaved={p => { setProducts(prev => [...prev.filter(x => x.id !== p.id), p]); setEditing(undefined); }} />}
    <label className="block text-sm">Cari produk<input type="search" className="form-input w-full mt-1" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama produk atau SKU" /></label>
    {error && <div role="alert" className="text-red-600 text-sm">{error} <button onClick={load} className="underline">Coba lagi</button></div>}
    {busy && <p role="status">Memuat katalog…</p>}
    {!busy && !products.length && <p className="text-sm text-on-surface-variant">Belum ada produk. Tambahkan produk pertama untuk mulai mencatat SKU.</p>}
    <div className="max-h-96 overflow-auto divide-y divide-border-glass">{products.filter(p => `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())).map(p => <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="font-semibold break-words">{p.name}</p><p className="text-sm text-on-surface-variant">{p.sku} · Rp {p.price.toLocaleString('id-ID')} / {unitDescription(p)}</p></div><div className="flex gap-2"><button disabled={busy||!featurePolicy.canStart} title={featurePolicy.reason} className="btn btn-secondary min-h-11" onClick={() => setEditing(p)}>Ubah</button><button disabled={busy||!featurePolicy.canStart} title={featurePolicy.reason} className="btn btn-secondary min-h-11 text-red-600" onClick={() => remove(p)}>Nonaktifkan</button></div></div>)}</div>
  </section>;
}
