import React, { useState } from 'react';
import { productsApi } from '../../../services/api';

export function ProductForm({ product, onSaved, onCancel, allowStock = false }) {
  const [form, setForm] = useState(product || { sku: '', name: '', price: '', stock: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async e => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const data = { sku: form.sku.trim(), name: form.name.trim(), price: Number(form.price), ...(allowStock && form.stock !== '' ? { stock: Number(form.stock) } : {}) };
      const res = product?.id ? await productsApi.update(product.id, data) : await productsApi.create(data);
      onSaved(res.data);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="rounded-xl border border-border-glass bg-surface-container p-4 space-y-4">
    <h4 className="font-semibold">{product ? 'Ubah produk' : 'Tambah produk'}</h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {['sku', 'name', 'price', ...(allowStock ? ['stock'] : [])].map(key => <label key={key} className="text-sm space-y-1">
        <span>{({ sku: 'Kode SKU', name: 'Nama produk', price: 'Harga (Rp)', stock: 'Referensi stok (opsional)' })[key]}</span>
        <input className="form-input w-full" required={key !== 'stock'} type={['price', 'stock'].includes(key) ? 'number' : 'text'} min={key === 'price' ? 1 : 0} step="1" value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
      </label>)}
    </div>
    {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
    <div className="flex flex-wrap gap-2"><button disabled={busy} className="btn btn-primary min-h-11" type="submit">{busy ? 'Menyimpan…' : 'Simpan produk'}</button><button disabled={busy} type="button" className="btn btn-secondary min-h-11" onClick={onCancel}>Batal</button></div>
  </form>;
}
