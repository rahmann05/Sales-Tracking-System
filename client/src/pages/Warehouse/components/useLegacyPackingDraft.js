import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { deliveryApi, outletsApi } from '../../../services/api';
import { useFeaturePolicy } from '../../../shared/hooks/useFeaturePolicy';
import { useOperationRequest } from '../../../shared/hooks/useOperationRequest';
import { useUnsavedNavigation } from '../../../shared/hooks/useUnsavedNavigation';
import { packingOrderIds } from '../../../../../shared/packing-orders.mjs';
import { shipmentInvoiceRequired } from '../../../../../shared/shipment-document.mjs';

const initialPackingItems = (doc, selectedOrders) => {
  if (doc?.items) return doc.items;
  if (!selectedOrders.length) {
    return [{ lineId: crypto.randomUUID(), name: '', sku: '', unit: '', quantity: 1 }];
  }
  return selectedOrders
    .flatMap((source) =>
      (source.fulfillmentLines || source.items || [])
        .filter((i) => (i.unpacked ?? i.quantity) > 0)
        .map((i) => ({ ...i, sourceOrderId: source.id, sourceOrderCode: source.code }))
    )
    .map((i) => ({
      lineId: i.id,
      sourceOrderItemId: i.id,
      sourceOrderId: i.sourceOrderId,
      sourceOrderCode: i.sourceOrderCode,
      sku: i.productSku ?? i.product?.sku ?? '',
      name: i.productName ?? i.product?.name ?? '',
      quantity: i.unpacked ?? i.quantity,
      maxQuantity: i.unpacked ?? i.quantity,
      unitPrice: i.unitPrice,
      unit: i.unit || 'unit',
      baseUnit: i.baseUnit ?? null,
      unitsPerUnit: i.unitsPerUnit ?? null,
    }));
};

const initialPackingOutlet = (doc, order) => {
  if (doc?.outlet) return doc.outlet;
  if (!order) return null;
  return {
    ...order.outlet,
    ...order.pjpStop?.outlet,
    ...order.customerSnapshot,
    id:
      order.outletId ||
      order.pjpStop?.outletId ||
      order.pjpStop?.outlet?.id ||
      order.customerSnapshot?.id,
  };
};

export function useLegacyPackingDraft({
  doc,
  order,
  orders,
  initialKind = 'PACKING',
  onSaved,
  onCancel,
}) {
  const operation = useOperationRequest('packing');
  const featurePolicy = useFeaturePolicy('PACKING');
  const { settings, user } = useApp();
  const selectedOrders = orders || (order ? [order] : []);
  const [documentKind, setDocumentKind] = useState(doc?.documentKind || initialKind);
  const invoiceRequired = shipmentInvoiceRequired(
    { documentKind },
    doc?.policySnapshot?.values || settings
  );
  const formRef = useRef(null);
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      formRef.current?.closest('main')?.scrollTo({ top: 0 });
      return;
    }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';
    formRef.current?.scrollIntoView({ block: 'start', behavior: motion });
  }, []);

  const [code, setCode] = useState(doc?.code || '');
  const [outlet, setOutlet] = useState(() => initialPackingOutlet(doc, order));
  const [search, setSearch] = useState('');
  const [outlets, setOutlets] = useState([]);
  const [searchingOutlets, setSearchingOutlets] = useState(false);
  const [items, setItems] = useState(() => initialPackingItems(doc, selectedOrders));
  const [invoices, setInvoices] = useState(
    doc?.invoices?.map((i) => ({
      invoiceNumber: i.invoiceNumber,
      totalCartons: i.totalCartons,
      totalAmount: i.totalAmount,
      items: i.items || [],
      taxRatePercent: i.taxRatePercent ?? undefined,
      taxIncluded: i.taxIncluded ?? undefined,
      taxRoundingMode: i.taxRoundingMode || 'NEAREST',
    })) || []
  );
  const [cartons, setCartons] = useState(doc?.totalCartons || 0);
  const [weight, setWeight] = useState(doc?.totalWeight || 0);
  const [notes, setNotes] = useState(doc?.notes || '');
  const [reason, setReason] = useState(doc?.overrideReason || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const snapshot = JSON.stringify([
    documentKind,
    code,
    outlet?.id,
    items,
    invoices,
    cartons,
    weight,
    notes,
    reason,
  ]);
  const initialSnapshot = useRef(snapshot);
  const dirty = snapshot !== initialSnapshot.current;
  useUnsavedNavigation(dirty, busy);

  const cancel = () => {
    if (!busy && (!dirty || window.confirm('Perubahan belum disimpan. Batalkan perubahan ini?'))) {
      onCancel();
    }
  };

  useEffect(() => {
    if (search.trim().length < 2) {
      setOutlets([]);
      return;
    }
    let active = true;
    setSearchingOutlets(true);
    const timer = setTimeout(() => {
      outletsApi
        .getAll({ search, limit: 15 })
        .then((r) => {
          if (!active) return;
          const d = r.data;
          setOutlets(Array.isArray(d) ? d : d?.data || d?.outlets || []);
        })
        .catch((e) => {
          if (active) setError(e.message || 'Gagal mencari outlet');
        })
        .finally(() => {
          if (active) setSearchingOutlets(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  const candidateOrderIds = doc ? packingOrderIds(doc) : selectedOrders.map((item) => item.id);
  const sourceOrderIds = candidateOrderIds.filter((id) =>
    items.some(
      (item) => item.sourceOrderId === id || (!item.sourceOrderId && candidateOrderIds.length === 1)
    )
  );
  const sourceOrderId = sourceOrderIds[0] || null;
  const totalCartonsNum = Number(cartons) || 0;
  const totalInvoiceCartons = invoices.reduce(
    (sum, inv) => sum + (Number(inv.totalCartons) || 0),
    0
  );
  const isCartonBalanced = totalCartonsNum > 0 && totalInvoiceCartons === totalCartonsNum;

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!outlet) return setError('Pilih outlet / toko tujuan terlebih dahulu.');
    if (items.length === 0) return setError('Minimal sertakan 1 baris barang produk.');
    setBusy(true);
    setError('');
    try {
      const data = {
        documentKind,
        releaseAfterSave: e.nativeEvent.submitter?.value === 'RELEASE',
        code,
        outletId: outlet.id,
        sourceOrderId: sourceOrderIds.length === 1 ? sourceOrderIds[0] : null,
        sourceOrderIds,
        items,
        invoices: invoices.map((i) => ({
          ...i,
          totalAmount:
            i.totalAmount === '' || i.totalAmount == null ? undefined : Number(i.totalAmount),
        })),
        totalCartons: Number(cartons),
        totalWeight: Number(weight),
        notes,
        overrideReason: reason,
        ...(doc ? { revision: doc.revision } : {}),
      };
      const response = doc
        ? await deliveryApi.updatePackingList(doc.id, data)
        : await deliveryApi.createPackingList(await operation.identify(data));
      const saved = response.data;
      operation.clear();
      initialSnapshot.current = snapshot;
      onSaved(
        saved?.status === 'RELEASED'
          ? 'Dokumen diserahkan ke gudang. Kepala gudang akan memeriksa muatan dan menyusun perjalanan.'
          : 'Draft tersimpan. Lengkapi dokumen, lalu serahkan ke gudang.',
        saved
      );
    } catch (err) {
      setError(err.message || 'Gagal menyimpan draft dokumen pengiriman');
    } finally {
      setBusy(false);
    }
  };

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { lineId: crypto.randomUUID(), name: '', sku: '', unit: '', quantity: 1 },
    ]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));
  const addInvoice = () =>
    setInvoices((prev) => [
      ...prev,
      {
        invoiceNumber: '',
        totalCartons: 1,
        totalAmount: '',
        items: [],
        taxRatePercent: order?.taxRatePercent ?? Number(settings.TAX_RATE_PERCENT ?? 0),
        taxIncluded: order?.taxIncluded ?? settings.ORDER_PRICES_INCLUDE_TAX !== false,
        taxRoundingMode:
          order?.policySnapshot?.values?.ORDER_TAX_ROUNDING_MODE ||
          settings.ORDER_TAX_ROUNDING_MODE ||
          'NEAREST',
      },
    ]);
  const removeInvoice = (index) => setInvoices((prev) => prev.filter((_, i) => i !== index));

  return {
    settings,
    featurePolicy,
    selectedOrders,
    formRef,
    documentKind,
    setDocumentKind,
    invoiceRequired,
    code,
    setCode,
    outlet,
    setOutlet,
    search,
    setSearch,
    outlets,
    setOutlets,
    searchingOutlets,
    items,
    setItems,
    invoices,
    setInvoices,
    cartons,
    setCartons,
    weight,
    setWeight,
    notes,
    setNotes,
    reason,
    setReason,
    error,
    busy,
    cancel,
    save,
    sourceOrderIds,
    sourceOrderId,
    totalCartonsNum,
    totalInvoiceCartons,
    isCartonBalanced,
    addItem,
    removeItem,
    addInvoice,
    removeInvoice,
  };
}
