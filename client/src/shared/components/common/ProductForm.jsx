import React, { useState } from 'react';
import {unitDefinitionError} from '../../../../../shared/product-units.mjs';
import { productsApi } from '../../../services/api';
import { BusinessCodeInput } from './BusinessCodeInput';

export function ProductForm({ product, onSaved, onCancel }) {
  const [form, setForm] = useState(product || { sku: '', name: '', price: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async e => {
    e.preventDefault();
    const units={unit:form.unit,baseUnit:form.baseUnit,unitsPerUnit:Number(form.unitsPerUnit)};
    const unitError=unitDefinitionError(units);if(unitError){setError(unitError);return;}
    setBusy(true); setError('');
    try {
      const data = { ...(!product?.id?{sku:form.sku.trim(),code:form.code || ''}:{}), name: form.name.trim(), price: Number(form.price),...units };
      const res = product?.id ? await productsApi.update(product.id, data) : await productsApi.create(data);
      onSaved(res.data);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="rounded-xl border border-border-glass bg-surface-container p-4 space-y-4">
    <h4 className="font-semibold">{product ? 'Ubah produk' : 'Tambah produk'}</h4>
    <BusinessCodeInput entity="PRODUCT_SKU" value={form.sku} onChange={sku=>setForm({...form,sku})} existing={Boolean(product?.id)} />
    <BusinessCodeInput entity="PRODUCT" value={form.code} onChange={code=>setForm({...form,code})} existing={Boolean(product?.id)} optional />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {['name', 'price'].map(key => <label key={key} className="text-sm space-y-1">
        <span>{({ sku: 'Kode SKU', name: 'Nama produk', price: 'Harga (Rp)' })[key]}</span>
        <input className="form-input w-full" required type={key === 'price' ? 'number' : 'text'} min={key === 'price' ? 1 : 0} step="1" value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
      </label>)}
    </div>
    <fieldset disabled={busy} className="space-y-3"><legend className="font-semibold">Satuan order dan isi kemasan</legend><p className="text-xs">Harga berlaku per satuan jual. Contoh: 1 dus = 12 pcs. Jumlah karton pengiriman dicatat terpisah.</p><div className="grid sm:grid-cols-3 gap-3">
      <label>Satuan jual<input required maxLength={32} className="form-input w-full" value={form.unit||''} onChange={e=>setForm({...form,unit:e.target.value})} placeholder="dus / pack / pcs"/></label>
      <label>Satuan dasar<input required maxLength={32} className="form-input w-full" value={form.baseUnit||''} onChange={e=>setForm({...form,baseUnit:e.target.value})} placeholder="pcs"/></label>
      <label>Isi per satuan jual<input required type="number" min={1} max={1000000} step={1} className="form-input w-full" value={form.unitsPerUnit??''} onChange={e=>setForm({...form,unitsPerUnit:e.target.value})}/></label>
    </div><p className="text-xs">Perubahan berlaku untuk order baru. Transaksi sebelumnya mempertahankan satuan dan isi kemasannya.</p></fieldset>
    {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
    <div className="flex flex-wrap gap-2"><button disabled={busy} className="btn btn-primary min-h-11" type="submit">{busy ? 'Menyimpan…' : 'Simpan produk'}</button><button disabled={busy} type="button" className="btn btn-secondary min-h-11" onClick={onCancel}>Batal</button></div>
  </form>;
}
