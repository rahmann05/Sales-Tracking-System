import React,{useState} from 'react';
import {unitDescription} from '../../../../../shared/product-units.mjs';
import { LuPlus, LuTrash2, LuPackage } from 'react-icons/lu';
export function PackingItemsSection({
  addItem,
  items,
  removeItem,
  setItems,
  orderLinked=false
}) {
  const [partial,setPartial]=useState(false);
  if(orderLinked)return <section className="space-y-3"><h3 className="font-semibold">Barang untuk pengiriman ini</h3><p className="text-sm">Default seluruh jumlah yang belum dibuatkan dokumen. Jumlah barang dan karton kemasan dicatat terpisah.</p><label className="flex items-center gap-2 min-h-11"><input type="checkbox" checked={partial} onChange={e=>setPartial(e.target.checked)}/>Atur jumlah / kirim sebagian</label><div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>Barang / order</th><th>Belum dibuatkan dokumen</th><th>Pada dokumen ini</th></tr></thead><tbody>{items.map((item,index)=><tr key={item.lineId}><td><strong>{item.name}</strong><small>{item.sourceOrderCode||item.sku} · {unitDescription(item)}</small></td><td>{item.maxQuantity??'Lihat order'} {item.maxQuantity!=null?item.unit:''}</td><td>{partial?<div className="flex items-center gap-2"><input className="form-input w-28" aria-label={`Jumlah ${item.name} pada dokumen`} type="number" required min="1" max={item.maxQuantity} step="1" value={item.quantity} onChange={e=>setItems(items.map((line,i)=>i===index?{...line,quantity:Number(e.target.value)}:line))}/><span>{item.unit}</span>{items.length>1&&<button type="button" className="admin-button" onClick={()=>removeItem(index)}>Hapus</button>}</div>:<strong>{item.quantity} {item.unit}</strong>}</td></tr>)}</tbody></table></div>{partial&&<p className="admin-footnote">Bagian yang tidak disertakan tetap berada pada order untuk dibuatkan dokumen berikutnya.</p>}</section>;
  return <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <LuPackage className="text-primary text-sm" />
                <span>Rincian Barang Muatan</span>
              </label>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-[11px] font-bold text-on-surface">
                {items.length} Barang
              </span>
            </div>

            <button type="button" disabled={orderLinked} onClick={addItem} className="px-3 py-1.5 rounded-xl border border-border-glass hover:bg-surface-container text-xs font-bold text-primary flex items-center gap-1.5 transition-all shadow-xs">
              <LuPlus className="text-sm" />
              <span>Tambah Barang</span>
            </button>
          </div>

          <p className="text-xs">Jumlah barang mengikuti satuan pada setiap baris. Karton pengiriman dicatat terpisah; tidak dikonversi otomatis dari jumlah barang.</p>
          <div className="space-y-2.5">
            {items.map((item, index) => <div key={item.lineId || index} className="p-3 rounded-xl bg-surface-container/30 border border-border-glass grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                    SKU / Kode
                  </label>
                  <input type="text" readOnly={orderLinked} aria-label={`SKU atau kode baris ${index+1}`} value={item.sku} onChange={e => setItems(items.map((v, i) => i === index ? {
            ...v,
            sku: e.target.value
          } : v))} placeholder="Contoh: SKU-001" className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border-glass text-xs font-mono text-on-surface" />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                    Nama Barang *
                  </label>
                  {orderLinked&&item.sourceOrderId&&<p className="text-xs mb-1">Order: {item.sourceOrderCode||item.sourceOrderId}</p>}
                  <input type="text" readOnly={orderLinked} required aria-label={`Nama barang baris ${index+1}`} value={item.name} onChange={e => setItems(items.map((v, i) => i === index ? {
            ...v,
            name: e.target.value
          } : v))} placeholder="Nama produk" className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border-glass text-xs font-bold text-on-surface" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                    Jumlah *
                  </label>
                  <input type="number" required min="1" step="1" aria-label={`Jumlah barang baris ${index+1}`} value={item.quantity} onChange={e => setItems(items.map((v, i) => i === index ? {
            ...v,
            quantity: Math.max(1, Number(e.target.value))
          } : v))} className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border-glass text-xs font-bold text-on-surface text-right" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">
                    Satuan * {orderLinked&&<span className="block">{unitDescription(item)}</span>}
                  </label>
                  <input type="text" readOnly={orderLinked} required aria-label={`Satuan barang baris ${index+1}`} value={item.unit} onChange={e => setItems(items.map((v, i) => i === index ? {
            ...v,
            unit: e.target.value
          } : v))} placeholder="pcs / karton" className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border-glass text-xs text-on-surface" />
                </div>

                <div className="sm:col-span-1 flex justify-center pb-0.5">
                  <button type="button" disabled={items.length <= 1} onClick={() => removeItem(index)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-all cursor-pointer" title="Hapus baris barang ini">
                    <LuTrash2 className="text-sm" />
                  </button>
                </div>
              </div>)}
          </div>
        </div>;
}
