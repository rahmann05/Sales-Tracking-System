import {useFeaturePolicy} from '../../../shared/hooks/useFeaturePolicy';
import {useFormDraft} from '../../../shared/hooks/useFormDraft';
import {orderPricing} from '../../../../../shared/order-pricing.mjs';
import {orderApprovalDecision} from '../../../../../shared/approval-workflow.mjs';
import {POLICY_OPTION_LABELS} from '../../../../../shared/operational-policy.mjs';
import {orderTerms} from '../../../../../shared/order-terms.mjs';
import { ProductForm } from '../../../shared/components/common/ProductForm';
import React, { useState } from 'react';
import {ordersApi} from '../../../services/api';
import { LuSend } from 'react-icons/lu';
import {SalesDialog} from './SalesDialog';
import { ProductOrderItem } from './ProductOrderItem';
import { useApp } from '../../../context/AppContext';
import { BusinessCodeInput } from '../../../shared/components/common/BusinessCodeInput';

/**
 * InputOrderModal Component (Single Responsibility: Order Taking Form Modal for Sales)
 * 1 File per Component
 */
export const InputOrderModal = ({ stop, onClose, onSubmitOrder }) => {
  const featurePolicy=useFeaturePolicy('ORDERS');
  const { products = [], setProducts, settings } = useApp(); // Produk dari PostgreSQL via context
  const {user}=useApp();
  const requestKey=`order-request:${user.id}:${stop?.id}`;
  const [pending,setPending]=useState(()=>{try{const saved=JSON.parse(sessionStorage.getItem(requestKey));return saved?.items?saved:null;}catch{return null;}});
  const [addingProduct, setAddingProduct] = useState(false);
  const [search,setSearch]=useState('');
  const draft=useFormDraft(`order:${stop?.id}`,{code:'',orderItems:[],priceOverrideReason:'',paymentType:stop?.outlet?.paymentType||settings.DEFAULT_PAYMENT_TYPE||'CASH'});
  const code=pending?.code??draft.value.code,setCode=draft.field('code');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const orderItems=pending?.items.map(i=>({product:{id:i.productId,name:i.productName,price:i.unitPrice,unit:i.unit,baseUnit:i.baseUnit,unitsPerUnit:i.unitsPerUnit},qty:i.quantity}))||draft.value.orderItems,setOrderItems=draft.field('orderItems');
  const paymentType=pending?.paymentType??draft.value.paymentType,setPaymentType=draft.field('paymentType');

  if (!stop) return null;

  const updateProductQty = (product, delta) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (!existing && delta > 0) {
        return [...prev, { product, qty: delta }];
      }
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) {
          return prev.filter((item) => item.product.id !== product.id);
        }
        return prev.map((item) => (item.product.id === product.id ? { ...item, qty: newQty } : item));
      }
      return prev;
    });
  };

  const pricing=pending?.pricing||orderPricing(orderItems.map(i=>({unitPrice:i.product.price,quantity:i.qty})),Number(settings.TAX_RATE_PERCENT??11),settings.ORDER_PRICES_INCLUDE_TAX!==false);
  const calculateTotal=()=>pricing.totalValue;
  const hasPriceOverride=orderItems.some(item=>{const current=products.find(p=>p.id===item.product.id);return current&&item.product.price!==current.price;});
  const approval=orderApprovalDecision({totalValue:pricing.totalValue,hasPriceOverride},settings);
  const priceOverrideReason=pending?.priceOverrideReason??draft.value.priceOverrideReason??'';
  const terms=pending?.expectedTermDays??orderTerms(paymentType,stop.outlet,settings.DEFAULT_TERM_OF_PAYMENT_DAYS??30);

  const handleSubmit = async () => {
    if (saving) return;
    if (orderItems.length === 0) {
      setError('Pilih minimal satu produk untuk membuat order.');
      return;
    }

    if(!pending&&hasPriceOverride&&settings.ORDER_PRICE_OVERRIDE_REQUIRE_REASON&&priceOverrideReason.trim().length<5){setError('Jelaskan alasan perubahan harga minimal 5 karakter.');return;}

    const itemsPayload = orderItems.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.qty,
      qty: item.qty,
      price: item.product.price,
      unitPrice: item.product.price,
      unit:item.product.unit??null,baseUnit:item.product.baseUnit??null,unitsPerUnit:item.product.unitsPerUnit??null,
      subtotal: item.product.price * item.qty,
    }));

    const payload=pending||{
      stopId: stop.id,
      requestId:crypto.randomUUID(),
      code,
      items: itemsPayload,
      paymentType,
      expectedTotal:pricing.totalValue,
      priceOverrideReason:priceOverrideReason.trim()||undefined,
      expectedTermDays:terms,
      pricing,
      totalAmount: calculateTotal(),
    };
    try{sessionStorage.setItem(requestKey,JSON.stringify(payload));}catch{setError('Browser tidak dapat menyimpan identitas pengiriman. Kosongkan ruang sesi lalu coba lagi.');return;}setPending(payload);
    setSaving(true); setError('');
    try { await onSubmitOrder(payload);sessionStorage.removeItem(requestKey);draft.clear();setPending(null); } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const resumeEditing=async()=>{setSaving(true);setError('');try{const result=await ordersApi.findRequest(pending.requestId);if(result.data){setError('Order sudah tersimpan. Kirim ulang order yang sama untuk mengambil hasilnya.');return;}draft.setValue({code:pending.code,orderItems,paymentType:pending.paymentType,priceOverrideReason:pending.priceOverrideReason||''});sessionStorage.removeItem(requestKey);setPending(null);}catch(e){setError(e.message);}finally{setSaving(false);}};

  const visibleProducts=products.filter(p=>`${p.name} ${p.code||p.sku||''}`.toLocaleLowerCase('id-ID').includes(search.trim().toLocaleLowerCase('id-ID')));
  return <SalesDialog title="Buat order" description={`${stop.outletName} · ${stop.outletCode||'Kode belum tersedia'}`} onClose={onClose} busy={saving} dirty={draft.dirty||!!pending} restored={draft.restored} draftError={draft.storageError} wide>
    {pending&&<div role="status" className="sales-form-help">Hasil pengiriman sebelumnya belum dikonfirmasi. Kirim ulang data yang sama agar tidak ganda.<button type="button" disabled={saving} className="app-button" onClick={resumeEditing}>Periksa hasil sebelum mengubah order</button></div>}
    <fieldset disabled={saving||!!pending}>
      <div className="sales-order-builder">
        <section className="sales-catalog"><h3>Pilih produk</h3><label>Cari produk<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nama atau kode produk…"/></label>
          {settings.SALES_ALLOW_PRODUCT_CREATE && (addingProduct ? <ProductForm onCancel={() => setAddingProduct(false)} onSaved={product => { setProducts(prev => [...prev, product]); setAddingProduct(false); }} /> : <button type="button" className="app-button" onClick={() => setAddingProduct(true)}>Tambah produk</button>)}
          <div className="sales-product-list">{visibleProducts.map(prd=>{const existing=orderItems.find(i=>i.product.id===prd.id);return <div key={prd.id}><ProductOrderItem product={existing?.product||prd} qty={existing?.qty||0} onQtyChange={updateProductQty}/>{settings.SALES_ALLOW_PRICE_OVERRIDE&&existing&&<label>Harga per unit (Rp)<input aria-label={`Harga ${prd.name}`} type="number" min="1" step="1" value={existing.product.price} onChange={e=>setOrderItems(prev=>prev.map(i=>i.product.id===prd.id?{...i,product:{...i.product,price:Number(e.target.value)}}:i))}/></label>}</div>;})}</div>
          {!visibleProducts.length&&<p className="sales-note">{products.length?'Tidak ada produk sesuai pencarian.':'Katalog produk belum tersedia. Hubungi Admin.'}</p>}
        </section>
        <aside className="sales-order-summary"><h3>Ringkasan order</h3><BusinessCodeInput entity="ORDER" value={code} onChange={setCode} disabled={saving||!!pending}/>
          <div>{orderItems.length?orderItems.map(i=><div className="sales-cart-line" key={i.product.id}><span>{i.product.name} × {i.qty}</span><span>Rp {(i.product.price*i.qty).toLocaleString('id-ID')}</span></div>):<p className="sales-note">Belum ada produk dipilih.</p>}</div>
          <label>Syarat order<select value={paymentType} onChange={e=>setPaymentType(e.target.value)}><option value="CASH">Tunai (CASH)</option><option value="TOP">Tempo (TOP)</option><option value="TRANSFER">Transfer</option></select></label>
          <p className="sales-note">Termin: {terms} hari{stop.outlet?.paymentType&&paymentType!==stop.outlet.paymentType?' · Berbeda dari syarat pelanggan':''}. Pembayaran dilakukan di luar aplikasi.</p>
          {hasPriceOverride&&<label>Alasan perubahan harga {settings.ORDER_PRICE_OVERRIDE_REQUIRE_REASON?'(wajib)':'(opsional)'}<textarea maxLength={2000} minLength={settings.ORDER_PRICE_OVERRIDE_REQUIRE_REASON?5:undefined} value={priceOverrideReason} onChange={e=>draft.field('priceOverrideReason')(e.target.value)}/></label>}
          <p className="sales-note">{pending?'Pengiriman ulang mengambil order yang sama jika sudah tersimpan.':`Perkiraan persetujuan: ${POLICY_OPTION_LABELS[approval.mode]}. ${approval.source==='AMOUNT'?'Mengikuti batas nominal.':approval.source==='PRICE_OVERRIDE'?'Mengikuti perubahan harga.':'Mengikuti aturan dasar.'} Alur akhir ditetapkan saat order dibuat.`}</p>
          <div className="sales-order-totals"><p><span>Subtotal</span><span>Rp {pricing.subtotal.toLocaleString('id-ID')}</span></p><p><span>Pajak {pricing.taxRatePercent}%</span><span>Rp {pricing.taxAmount.toLocaleString('id-ID')}</span></p><small className="sales-note">Pajak {pricing.taxIncluded?'sudah termasuk dalam harga':'ditambahkan ke subtotal'}.</small><p><span>Total</span><strong>Rp {calculateTotal().toLocaleString('id-ID')}</strong></p></div>
        </aside>
      </div>
    </fieldset>
    {error&&<p role="alert" className="app-error">{error}</p>}
    <div className="sales-modal-actions"><p className="sales-note">{pending?'Kirim ulang isian yang sama untuk memeriksa hasil pengiriman sebelumnya.':!featurePolicy.canStart?featurePolicy.reason:approval.mode==='NONE'?'Order diterima sesuai aturan dan dapat diproses tanpa pemeriksaan manusia.':'Order dikirim untuk pemeriksaan sebelum diproses.'}</p><button type="button" onClick={handleSubmit} disabled={saving||!orderItems.length||!pending&&!featurePolicy.canStart} title={!pending?featurePolicy.reason:undefined} className="app-button app-button-primary"><LuSend/>{saving?'Mengirim…':pending?'Kirim ulang order yang sama':approval.mode==='NONE'?'Kirim order':'Kirim order untuk diperiksa'}</button></div>
  </SalesDialog>;
};
