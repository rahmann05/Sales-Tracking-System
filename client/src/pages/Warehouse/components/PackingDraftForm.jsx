import {useOperationRequest} from '../../../shared/hooks/useOperationRequest';
import {useFeaturePolicy} from '../../../shared/hooks/useFeaturePolicy';
import { PackingOutletSection } from './PackingOutletSection';
import { PackingItemsSection } from './PackingItemsSection';
import { PackingInvoicesSection } from './PackingInvoicesSection';
import {PackingLoadForm} from './PackingLoadForm';
import React, { useEffect, useRef, useState } from 'react';
import { deliveryApi, outletsApi } from '../../../services/api';
import { BusinessCodeInput } from '../../../shared/components/common/BusinessCodeInput';
import {useApp} from '../../../context/AppContext';
import {useUnsavedNavigation} from '../../../shared/hooks/useUnsavedNavigation';
import {packingOrderIds} from '../../../../../shared/packing-orders.mjs';
import {shipmentInvoiceRequired} from '../../../../../shared/shipment-document.mjs';
import { LuCircleAlert, LuRefreshCw, LuPackage, LuX } from 'react-icons/lu';
export function PackingDraftForm(props){
 if(props.document?.loadPlanVersion===2||!props.document&&(props.documentKind||'PACKING')==='PACKING')return <PackingLoadForm {...props}/>;
 return <LegacyPackingDraftForm {...props}/>;
}
function LegacyPackingDraftForm({
  document: doc,
  order,
  orders,
  documentKind:initialKind='PACKING',
  onSaved,
  onCancel
}) {
  const operation=useOperationRequest('packing');
  const featurePolicy=useFeaturePolicy('PACKING');
  const {settings,user}=useApp();
  const selectedOrders=orders|| (order?[order]:[]);
  const [documentKind,setDocumentKind]=useState(doc?.documentKind||initialKind);
  const invoiceRequired=shipmentInvoiceRequired({documentKind},doc?.policySnapshot?.values||settings);
  const formRef=useRef(null);
  useEffect(()=>{if(user?.role==='ADMIN'){formRef.current?.closest('main')?.scrollTo({top:0});return;}formRef.current?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});},[]);
  const [code, setCode] = useState(doc?.code || '');
  const [outlet, setOutlet] = useState(doc?.outlet || (order?{...order.outlet,...order.pjpStop?.outlet,...order.customerSnapshot,id:order.outletId||order.pjpStop?.outletId||order.pjpStop?.outlet?.id||order.customerSnapshot?.id}:null));
  const [search, setSearch] = useState('');
  const [outlets, setOutlets] = useState([]);
  const [searchingOutlets, setSearchingOutlets] = useState(false);
  const [items, setItems] = useState(doc?.items || (selectedOrders.length?selectedOrders.flatMap(source=>(source.fulfillmentLines||source.items||[]).filter(i=>(i.unpacked??i.quantity)>0).map(i=>({...i,sourceOrderId:source.id,sourceOrderCode:source.code}))).map(i => ({
    lineId: i.id,
    sourceOrderItemId: i.id,
    sourceOrderId:i.sourceOrderId,
    sourceOrderCode:i.sourceOrderCode,
    sku: i.productSku??i.product?.sku??'',
    name: i.productName??i.product?.name??'',
    quantity: i.unpacked ?? i.quantity,
    maxQuantity: i.unpacked ?? i.quantity,
    unitPrice:i.unitPrice,
    unit:i.unit||'unit',baseUnit:i.baseUnit??null,unitsPerUnit:i.unitsPerUnit??null
  })): [{
    lineId:crypto.randomUUID(),
    name: '',
    sku: '',
    unit: '',
    quantity: 1
  }]));
  const [invoices, setInvoices] = useState(doc?.invoices?.map(i=>({invoiceNumber:i.invoiceNumber,totalCartons:i.totalCartons,totalAmount:i.totalAmount,items:i.items||[],taxRatePercent:i.taxRatePercent??undefined,taxIncluded:i.taxIncluded??undefined,taxRoundingMode:i.taxRoundingMode||'NEAREST'})) || []);
  const [cartons, setCartons] = useState(doc?.totalCartons || 0);
  const [weight, setWeight] = useState(doc?.totalWeight || 0);
  const [notes, setNotes] = useState(doc?.notes || '');
  const [reason, setReason] = useState(doc?.overrideReason || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const snapshot=JSON.stringify([documentKind,code,outlet?.id,items,invoices,cartons,weight,notes,reason]);
  const initialSnapshot=useRef(snapshot);
  const dirty=snapshot!==initialSnapshot.current;
  useUnsavedNavigation(dirty,busy);
  const cancel=()=>{if(!busy&&(!dirty||window.confirm('Perubahan belum disimpan. Batalkan perubahan ini?')))onCancel();};

  // Outlet search debounce
  useEffect(() => {
    if (search.trim().length < 2) {
      setOutlets([]);
      return;
    }
    let active = true;
    setSearchingOutlets(true);
    const timer = setTimeout(() => {
      outletsApi.getAll({
        search,
        limit: 15
      }).then(r => {
        if (active) {
          const d = r.data;
          setOutlets(Array.isArray(d) ? d : d?.data || d?.outlets || []);
        }
      }).catch(e => {
        if (active) setError(e.message || 'Gagal mencari outlet');
      }).finally(() => {
        if (active) setSearchingOutlets(false);
      });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);
  const candidateOrderIds=doc?packingOrderIds(doc):selectedOrders.map(item=>item.id);
  const sourceOrderIds=candidateOrderIds.filter(id=>items.some(item=>item.sourceOrderId===id||(!item.sourceOrderId&&candidateOrderIds.length===1)));
  const sourceOrderId=sourceOrderIds[0]||null;

  // Real-time carton match calculation
  const totalCartonsNum = Number(cartons) || 0;
  const totalInvoiceCartons = invoices.reduce((sum, inv) => sum + (Number(inv.totalCartons) || 0), 0);
  const isCartonBalanced = totalCartonsNum > 0 && totalInvoiceCartons === totalCartonsNum;
  const save = async e => {
    e.preventDefault();
    if (busy) return;
    if (!outlet) {
      setError('Pilih outlet / toko tujuan terlebih dahulu.');
      return;
    }
    if (items.length === 0) {
      setError('Minimal sertakan 1 baris barang produk.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = {
        documentKind,
        releaseAfterSave:e.nativeEvent.submitter?.value==='RELEASE',
        code,
        outletId: outlet.id,
        sourceOrderId:sourceOrderIds.length===1?sourceOrderIds[0]:null,
        sourceOrderIds,
        items,
        invoices: invoices.map(i => ({
          ...i,
          totalAmount: i.totalAmount === '' || i.totalAmount == null ? undefined : Number(i.totalAmount)
        })),
        totalCartons: Number(cartons),
        totalWeight: Number(weight),
        notes,
        overrideReason: reason,
        ...(doc ? {
          revision: doc.revision
        } : {})
      };
      const response=doc?await deliveryApi.updatePackingList(doc.id,data):await deliveryApi.createPackingList(await operation.identify(data));
      const saved=response.data;operation.clear();
      initialSnapshot.current=snapshot;
      onSaved(saved?.status==='RELEASED'?'Dokumen diserahkan ke gudang. Kepala gudang akan memeriksa muatan dan menyusun perjalanan.':'Draft tersimpan. Lengkapi dokumen, lalu serahkan ke gudang.',saved);
    } catch (e) {
      setError(e.message || 'Gagal menyimpan draft dokumen pengiriman');
    } finally {
      setBusy(false);
    }
  };
  const addItem = () => {
    setItems(prev => [...prev, {
      lineId:crypto.randomUUID(),
      name: '',
      sku: '',
      unit: '',
      quantity: 1
    }]);
  };
  const removeItem = index => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };
  const addInvoice = () => {
    setInvoices(prev => [...prev, {
      invoiceNumber: '',
      totalCartons: 1,
      totalAmount: ''
      ,items:[],taxRatePercent:order?.taxRatePercent??Number(settings.TAX_RATE_PERCENT??11),taxIncluded:order?.taxIncluded??settings.ORDER_PRICES_INCLUDE_TAX!==false,taxRoundingMode:order?.policySnapshot?.values?.ORDER_TAX_ROUNDING_MODE||settings.ORDER_TAX_ROUNDING_MODE||'NEAREST'
    }]);
  };
  const removeInvoice = index => {
    setInvoices(prev => prev.filter((_, i) => i !== index));
  };
  return <form ref={formRef} onSubmit={save} className="rounded-2xl border border-primary/30 bg-surface p-5 md:p-6 space-y-6 shadow-md text-on-surface animate-fade-in">
      {/* Form Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-glass pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <LuPackage className="text-lg" />
            </span>
            <h2 className="text-lg font-black tracking-tight text-on-surface">
              {doc ? `Edit Dokumen: ${doc.code}` : documentKind==='MANIFEST'?'Buat manifest pengiriman':'Siapkan dokumen muatan'}
            </h2>
          </div>
          <p className="text-xs text-on-surface-variant">
            {sourceOrderId ? `Terhubung dengan ${sourceOrderIds.length} order. Asal barang dan harga setiap order tetap dipertahankan.` : 'Penyusunan dokumen muatan manual tanpa keterikatan order sales.'}
          </p>
        </div>

        <button type="button" onClick={cancel} disabled={busy} className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all" title="Tutup form">
          <LuX className="text-lg" />
        </button>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-2">
          <LuCircleAlert className="text-sm shrink-0" />
          <span>{error}</span>
        </div>}

      <fieldset disabled={busy} className="space-y-6">
        <details><summary className="min-h-11 cursor-pointer">Jenis dokumen dan penomoran</summary><label className="block text-sm">Jenis dokumen<select className="form-input block" disabled={!!doc} value={documentKind} onChange={e=>{setDocumentKind(e.target.value);setCode('');}}><option value="PACKING">Packing list</option>{(settings.PACKING_ALLOW_MANIFEST||documentKind==='MANIFEST')&&<option value="MANIFEST">Manifest pengiriman tanpa dokumen packing</option>}</select></label>
        {documentKind==='MANIFEST'&&<p className="text-sm">Manifest mencatat muatan dan tujuan langsung. Dokumen ini tidak menyatakan barang sudah dipacking atau diperiksa. Bukti persiapan dan pengiriman tetap mengikuti aturan trip.</p>}
        <BusinessCodeInput entity={documentKind==='MANIFEST'?'SHIPPING_MANIFEST':'PACKING_LIST'} value={code} onChange={setCode} existing={Boolean(doc)} /></details>
        {/* ── Outlet Selection Section ── */}
        <PackingOutletSection doc={doc} outlet={outlet} outlets={outlets} search={search} searchingOutlets={searchingOutlets} setOutlet={setOutlet} setOutlets={setOutlets} setSearch={setSearch} sourceOrderId={sourceOrderId} />

        {/* ── Items List Section ── */}
        <PackingItemsSection orderLinked={Boolean(sourceOrderId)} addItem={addItem} items={items} removeItem={removeItem} setItems={setItems} />

        {/* ── Cartons & Weight Summary ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container/40 border border-border-glass">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Total Fisik Karton / Kemasan Luar *
            </label>
            <input aria-label="Total karton fisik" type="number" min="0" step="1" required value={cartons} onChange={e => setCartons(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-sm font-black text-on-surface" />
            <span className="text-[10px] text-on-surface-variant mt-1 block">
              Jumlah kemasan karton fisik untuk alokasi kapasitas kendaraan.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Estimasi Berat Total (Kg)
            </label>
            <input aria-label="Estimasi berat total dalam kilogram" type="number" min="0" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-sm font-bold text-on-surface" />
            <span className="text-[10px] text-on-surface-variant mt-1 block">
              Opsional, untuk perhitungan beban tonase kendaraan pengiriman.
            </span>
          </div>
        </div>

        {/* ── Invoices Section ── */}
        <PackingInvoicesSection invoiceRequired={invoiceRequired} items={items} orderLinked={!!sourceOrderId} addInvoice={addInvoice} doc={doc} invoices={invoices} isCartonBalanced={isCartonBalanced} removeInvoice={removeInvoice} setInvoices={setInvoices} totalCartonsNum={totalCartonsNum} totalInvoiceCartons={totalInvoiceCartons} />

        {/* ── Additional Notes & Reason ── */}
        <div className="space-y-3">
          {selectedOrders.some(source=>source.status==='PENDING_APPROVAL') && <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Alasan pengecualian: order belum disetujui
              </label>
              <textarea aria-label="Alasan pengecualian Admin" value={reason} onChange={e => setReason(e.target.value)} placeholder="Catatan justifikasi override pembuatan packing list dari order pending..." rows={2} className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs text-on-surface resize-none" />
            </div>}

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Catatan Instruksi Pengiriman / Khusus Gudang
            </label>
            <textarea aria-label="Instruksi pengiriman" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instruksi tambahan untuk tim gudang atau supir (misal: titip faktur asli, simpan di tempat sejuk)..." rows={2} className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs text-on-surface resize-none" />
          </div>
        </div>

        <div className="work-step-intro"><strong>Langkah berikutnya: kepala gudang</strong>Setelah diserahkan, dokumen masuk antrean muatan untuk diperiksa dan dijadwalkan. Menyimpan draft belum menyerahkan muatan.</div>
        {/* ── Form Actions ── */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-glass">
          <button type="button" disabled={busy} onClick={cancel} className="px-4 py-2 rounded-xl border border-border-glass text-xs font-bold text-on-surface hover:bg-surface-container transition-all">
            Batal
          </button>
          <button type="submit" value="DRAFT" disabled={busy || !outlet || !doc?.id&&!featurePolicy.canStart} title={!doc?.id?featurePolicy.reason:undefined} className="px-6 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer">
            <LuRefreshCw className={`text-xs ${busy ? 'animate-spin' : ''}`} />
            <span>{busy ? 'Menyimpan Dokumen…' : doc ? 'Simpan Perubahan' : settings.PACKING_AUTO_RELEASE?'Simpan dokumen':'Simpan draft'}</span>
          </button>
          {!settings.PACKING_AUTO_RELEASE&&<button type="submit" value="RELEASE" className="admin-button primary" disabled={busy||!outlet||!doc?.id&&!featurePolicy.canStart}>{busy?'Menyimpan…':'Serahkan ke gudang'}</button>}
        </div>
      </fieldset>
    </form>;
}
