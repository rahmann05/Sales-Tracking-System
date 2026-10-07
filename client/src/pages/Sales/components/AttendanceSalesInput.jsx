import React, { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { productsApi } from '../../../services/api';
import { ProductForm } from '../../../shared/components/common/ProductForm';

export function AttendanceSalesInput({ value, onChange }) {
  const { settings, products, setProducts } = useApp();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { let active = true; productsApi.getAll().then(res => { if (active) setProducts(res.data || []); }).catch(err => { if (active) setError(err.message); }); return () => { active = false; }; }, [setProducts]);
  if (!settings.ATTENDANCE_ALLOW_MANUAL_SALES) return <p className="text-sm text-on-surface-variant">Input hasil penjualan saat absen dinonaktifkan oleh admin.</p>;
  return <section className="rounded-xl border border-border-glass p-4 space-y-3">
    <h4 className="font-semibold">Hasil penjualan <span className="text-sm font-normal text-on-surface-variant">(opsional)</span></h4>
    <p className="text-sm text-on-surface-variant">Boleh dikosongkan. Jika sudah membuat order, laporan menggunakan nominal dan SKU order yang disetujui. Isian ini tidak membuat pesanan pengiriman.</p>
    <p className="text-sm text-on-surface-variant">{settings.MANUAL_SALES_REPORT_MODE === 'REQUIRE_APPROVAL' ? 'Hasil manual diajukan untuk persetujuan; baru dihitung setelah disetujui.' : 'Hasil manual disimpan sebagai catatan, tidak masuk nominal/SKU laporan.'}</p>
    <label className="block text-sm">Nominal penjualan (Rp)<input className="form-input w-full mt-1" type="number" min="0" max="1000000000000" step="1" inputMode="numeric" value={value.orderAmount} onChange={e => onChange({ ...value, orderAmount: e.target.value })} placeholder="0" /></label>
    <label className="block text-sm">Cari SKU terjual<input className="form-input w-full mt-1" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama atau kode SKU" /></label>
    {error && <p role="alert" className="text-red-600 text-sm">Katalog gagal dimuat: {error}</p>}
    <div className="max-h-44 overflow-auto space-y-1">{products.filter(p => `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())).map(p => <label key={p.id} className="flex items-center gap-3 min-h-11 text-sm cursor-pointer"><input type="checkbox" checked={value.productIds.includes(p.id)} onChange={e => onChange({ ...value, productIds: e.target.checked ? [...value.productIds, p.id] : value.productIds.filter(id => id !== p.id) })} /><span>{p.name} <span className="text-on-surface-variant">({p.sku})</span></span></label>)}</div>
    <p className="text-sm">{value.productIds.length} jenis SKU dipilih. SKU dihitung sebagai jenis produk, bukan jumlah unit.</p>
    {!products.length && <p className="text-sm text-on-surface-variant">Katalog kosong. Hubungi admin untuk menambahkan produk.</p>}
    {settings.SALES_ALLOW_PRODUCT_CREATE && (adding ? <ProductForm onCancel={() => setAdding(false)} onSaved={p => { setProducts(prev => [...prev, p]); onChange({ ...value, productIds: [...value.productIds, p.id] }); setAdding(false); }} /> : <button type="button" className="btn btn-secondary min-h-11" onClick={() => setAdding(true)}>Tambah produk baru</button>)}
  </section>;
}
