import {orderPricing} from '../../../../../shared/order-pricing.mjs';
import { ProductForm } from '../../../shared/components/common/ProductForm';
import React, { useState } from 'react';
import {ordersApi} from '../../../services/api';
import { LuSend } from 'react-icons/lu';
import { FiXCircle } from 'react-icons/fi';
import { ProductOrderItem } from './ProductOrderItem';
import { useApp } from '../../../context/AppContext';
import { BusinessCodeInput } from '../../../shared/components/common/BusinessCodeInput';

/**
 * InputOrderModal Component (Single Responsibility: Order Taking Form Modal for Sales)
 * 1 File per Component
 */
export const InputOrderModal = ({ stop, onClose, onSubmitOrder }) => {
  const { products = [], setProducts, settings } = useApp(); // Produk dari PostgreSQL via context
  const {user}=useApp();
  const requestKey=`order-request:${user.id}:${stop?.id}`;
  const [pending,setPending]=useState(()=>{try{const saved=JSON.parse(sessionStorage.getItem(requestKey));return saved?.items?saved:null;}catch{return null;}});
  const [addingProduct, setAddingProduct] = useState(false);
  const [code,setCode]=useState(pending?.code||'');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [orderItems, setOrderItems] = useState(()=>pending?.items.map(i=>({product:{id:i.productId,name:i.productName,price:i.unitPrice,unit:i.unit,baseUnit:i.baseUnit,unitsPerUnit:i.unitsPerUnit},qty:i.quantity}))||[]);
  const [paymentType, setPaymentType] = useState(pending?.paymentType||stop?.outlet?.paymentType || settings.DEFAULT_PAYMENT_TYPE || 'CASH');

  if (!stop) return null;

  const updateProductQty = (product, delta) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (!existing && delta > 0) {
        return [...prev, { product, qty: 1 }];
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
  const terms=pending?.expectedTermDays??(paymentType==='TOP'?(stop.outlet?.termOfPaymentDays||settings.DEFAULT_TERM_OF_PAYMENT_DAYS||30):0);

  const handleSubmit = async () => {
    if (saving) return;
    if (orderItems.length === 0) {
      alert('Pilih minimal 1 produk untuk membuat order.');
      return;
    }

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
      expectedTermDays:terms,
      pricing,
      totalAmount: calculateTotal(),
    };
    sessionStorage.setItem(requestKey,JSON.stringify(payload));setPending(payload);
    setSaving(true); setError('');
    try { await onSubmitOrder(payload);sessionStorage.removeItem(requestKey);setPending(null); } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const resumeEditing=async()=>{setSaving(true);setError('');try{const result=await ordersApi.findRequest(pending.requestId);if(result.data){setError('Order sudah tersimpan. Kirim ulang order yang sama untuk mengambil hasilnya.');return;}sessionStorage.removeItem(requestKey);setPending(null);}catch(e){setError(e.message);}finally{setSaving(false);}};

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border-glass rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-glass pb-3">
          <div>
            <h3 className="font-bold text-lg text-on-surface">Form Input Order Sales</h3>
            <p className="text-xs text-on-surface-variant">Outlet: {stop.outletName} ({stop.outletCode})</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant">
            <FiXCircle className="text-xl" />
          </button>
        </div>

        {pending&&<div role="status" className="p-3 border rounded-xl text-sm">Hasil order sebelumnya belum dikonfirmasi. Kirim ulang menggunakan data yang sama agar tidak ganda. Total yang dikirim: Rp {pending.expectedTotal.toLocaleString('id-ID')}.<button type="button" disabled={saving} className="block min-h-11 underline" onClick={resumeEditing}>Periksa hasil sebelum mengubah order</button></div>}
        <fieldset disabled={saving||!!pending} className="space-y-5">
        <BusinessCodeInput entity="ORDER" value={code} onChange={setCode} disabled={saving||!!pending} />
        <div className="text-xs bg-surface-variant/40 p-3 rounded-2xl border border-border-glass flex items-center justify-between">
          <span className="text-on-surface-variant">Saldo piutang:</span>
          <p className="font-bold text-amber-600">Belum tersedia dari buku transaksi</p>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-sm text-on-surface">Pilih Produk SKU</h4>
          {settings.SALES_ALLOW_PRODUCT_CREATE && (addingProduct ? <ProductForm onCancel={() => setAddingProduct(false)} onSaved={product => { setProducts(prev => [...prev, product]); setAddingProduct(false); }} /> : <button type="button" className="btn btn-secondary min-h-11" onClick={() => setAddingProduct(true)}>Tambah produk</button>)}
          <div className="space-y-2">
            {!products.length && <p className="text-sm text-on-surface-variant">Belum ada produk. Admin dapat menambahkan melalui Katalog produk di Pengaturan.</p>}
            {products.map((prd) => {
              const existing = orderItems.find((item) => item.product.id === prd.id);
              const qty = existing ? existing.qty : 0;
              return (
                <div key={prd.id}><ProductOrderItem
                  key={prd.id}
                  product={prd}
                  qty={qty}
                  onQtyChange={updateProductQty}
                />
                {settings.SALES_ALLOW_PRICE_OVERRIDE && qty > 0 && <label className="block text-sm mt-2">Harga per unit {prd.name} (Rp)<input type="number" min="1" step="1" className="form-input w-full" value={existing.product.price} onChange={e => setOrderItems(prev => prev.map(item => item.product.id === prd.id ? { ...item, product: { ...item.product, price: Number(e.target.value) } } : item))} /></label>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="form-label">Syarat Pembayaran</label>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="form-select"
          >
            <option value="CASH">CASH (Bayar Tunai saat kirim)</option>
            <option value="TOP">TOP (Termin / Tempo)</option>
            <option value="TRANSFER">TRANSFER (Transfer Bank)</option>
          </select>
        </div>

        <p className="text-sm">Termin: {terms} hari{stop.outlet?.paymentType && paymentType!==stop.outlet.paymentType?' · Berbeda dari syarat pelanggan':''}</p>
        <div className="text-sm space-y-1"><p>Subtotal: Rp {pricing.subtotal.toLocaleString('id-ID')}</p><p>Pajak {pricing.taxRatePercent}% ({pricing.taxIncluded?'sudah termasuk':'ditambahkan'}): Rp {pricing.taxAmount.toLocaleString('id-ID')}</p></div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="pt-3 border-t border-border-glass flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant">Total Nilai Order:</span>
            <p className="text-lg font-bold text-primary">Rp {calculateTotal().toLocaleString('id-ID')}</p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !orderItems.length}
            className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md"
          >
            <LuSend className="text-sm" />
            <span>{pending?'Kirim ulang order yang sama':'Submit Order ke Admin'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
