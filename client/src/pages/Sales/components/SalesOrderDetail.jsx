import React from 'react';
import {unitDescription} from '../../../../../shared/product-units.mjs';
import {orderStatusLabel,fulfillmentLabel,stampWib} from '../salesPresentation';
export function SalesOrderDetail({order:o}){
  return <div className="sales-visit-detail">
    <div><span className="admin-eyebrow">{o.code||o.id}</span><h3>{o.pjpStop?.outlet?.name||o.customerSnapshot?.name||'Pelanggan'}</h3></div>
    <dl><div><dt>Persetujuan</dt><dd>{orderStatusLabel(o.status)}</dd></div><div><dt>Pemenuhan</dt><dd>{fulfillmentLabel(o.fulfillmentStatus)}</dd></div><div><dt>Dibuat</dt><dd>{stampWib(o.createdAt)}</dd></div><div><dt>Janji pengiriman</dt><dd>{o.promisedAt?stampWib(o.promisedAt):'Belum ditetapkan'}</dd></div><div><dt>Nilai order</dt><dd>Rp {Number(o.totalValue||0).toLocaleString('id-ID')}</dd></div><div><dt>Syarat order</dt><dd>{({TOP:'Tempo (TOP)',CASH:'Tunai',TRANSFER:'Transfer'})[o.paymentType]||o.paymentType||'Belum tersedia'}{o.paymentType==='TOP'?` · ${o.termOfPaymentDays??'—'} hari`:''}</dd></div></dl>
    {o.rejectionReason&&<p role="note" className="app-error">Alasan ditolak: {o.rejectionReason}</p>}
    <p className="sales-note">Persetujuan order dan penerimaan barang dipantau terpisah. Syarat order bukan bukti pembayaran.</p>
    <section><h4>Rincian produk</h4><div className="sales-order-lines">{(o.items||[]).map(i=><div key={i.id||i.productId}><strong>{i.productName||i.product?.name}</strong><span>{i.quantity} {unitDescription(i)} × Rp {Number(i.unitPrice??i.price??0).toLocaleString('id-ID')}</span></div>)}</div></section>
    {o.status!=='REJECTED'&&<section><h4>Perjalanan pemenuhan</h4>{(o.fulfillmentLines||[]).map(i=><article key={i.id} className="sales-fulfillment-line"><strong>{i.productName||i.product?.name}</strong><p className="sales-note">Satuan: {unitDescription(i)}</p><dl>{[['Dipesan',i.quantity],['Dalam packing',i.prepared],['Diterima pelanggan',i.accepted],['Dibatalkan',i.cancelled],['Sisa kewajiban',i.remaining],['Belum dipacking',i.unpacked]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value??'—'}</dd></div>)}</dl></article>)}{!o.fulfillmentLines?.length&&<p className="sales-note">Rincian pemenuhan belum tersedia.</p>}</section>}
    {!!o.history?.length&&<details><summary>Riwayat order ({o.history.length})</summary>{o.history.map((h,i)=><p className="sales-note" key={i}>{stampWib(h.at)} · {h.action} · {h.actorName||h.actorId}{h.note?` · ${h.note}`:''}</p>)}</details>}
  </div>;
}
