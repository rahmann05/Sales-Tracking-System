import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ordersApi, productsApi } from '../../../services/api';
import { useFormDraft } from '../../../shared/hooks/useFormDraft';
import { orderApprovalDecision } from '../../../../../shared/approval-workflow.mjs';
import { orderPricing, priceOverrideError } from '../../../../../shared/order-pricing.mjs';
import { orderTerms } from '../../../../../shared/order-terms.mjs';

export function useInputOrderState({ stop, onSubmitOrder, adminPlaceId }) {
  const { products = [], setProducts, settings, user } = useApp();
  const requestKey = `order-request:${user.id}:${stop?.id || stop?.outletId}`;
  const draft = useFormDraft(`order:${stop?.id || stop?.outletId}`, () => {
    let pending = null;
    try {
      const saved = JSON.parse(sessionStorage.getItem(requestKey));
      if (saved?.items) pending = saved;
    } catch {}
    return {
      code: '',
      orderItems: [],
      priceOverrideReason: '',
      contextReason: '',
      paymentType: stop?.outlet?.paymentType || settings.DEFAULT_PAYMENT_TYPE || 'CASH',
      pending,
    };
  });

  const pending = draft.value.pending;
  const setPending = draft.field('pending');
  const code = pending?.code ?? draft.value.code;
  const setCode = draft.field('code');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productLoadError, setProductLoadError] = useState('');
  const catalogLoadedRef = useRef(false);

  const loadCatalog = async () => {
    setLoadingProducts(true);
    setProductLoadError('');
    try {
      const res = await productsApi.getAll();
      const raw = res?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : raw?.items || [];
      setProducts(list);
    } catch (err) {
      setProductLoadError(err.message || 'Gagal memuat katalog produk');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (!stop || products.length || catalogLoadedRef.current) return;
    catalogLoadedRef.current = true;
    loadCatalog();
  }, [stop, products.length]);

  const orderItems =
    pending?.items.map((i) => ({
      product: {
        id: i.productId,
        name: i.productName,
        price: i.unitPrice,
        unit: i.unit,
        baseUnit: i.baseUnit,
        unitsPerUnit: i.unitsPerUnit,
      },
      qty: i.quantity,
    })) || draft.value.orderItems;
  const setOrderItems = draft.field('orderItems');
  const paymentType = pending?.paymentType ?? draft.value.paymentType;
  const setPaymentType = draft.field('paymentType');

  const updateProductQty = (product, delta) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (!existing && delta > 0) return [...prev, { product, qty: delta }];
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) return prev.filter((item) => item.product.id !== product.id);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: newQty } : item
        );
      }
      return prev;
    });
  };

  const pricing =
    pending?.pricing ||
    orderPricing(
      orderItems.map((i) => ({ unitPrice: i.product.price, quantity: i.qty })),
      Number(settings.TAX_RATE_PERCENT ?? 11),
      settings.ORDER_PRICES_INCLUDE_TAX !== false,
      settings.ORDER_TAX_ROUNDING_MODE || 'NEAREST'
    );
  const hasPriceOverride = orderItems.some((item) => {
    const current = products.find((p) => p.id === item.product.id);
    return current && item.product.price !== current.price;
  });
  const approval = adminPlaceId
    ? { mode: 'NONE', source: 'ADMIN_DIRECT' }
    : orderApprovalDecision({ totalValue: pricing.totalValue, hasPriceOverride }, settings);
  const priceOverrideReason = pending?.priceOverrideReason ?? draft.value.priceOverrideReason ?? '';
  const contextReason = pending?.contextReason ?? draft.value.contextReason ?? '';
  const terms =
    pending?.expectedTermDays ??
    orderTerms(paymentType, stop?.outlet, settings.DEFAULT_TERM_OF_PAYMENT_DAYS ?? 30);

  const validateBeforeSubmit = () => {
    if (orderItems.length === 0) return 'Pilih minimal satu produk untuk membuat order.';
    if (
      !pending &&
      hasPriceOverride &&
      settings.ORDER_PRICE_OVERRIDE_REQUIRE_REASON &&
      priceOverrideReason.trim().length < 5
    ) {
      return 'Jelaskan alasan perubahan harga minimal 5 karakter.';
    }
    if (
      !pending &&
      !stop?.id &&
      !adminPlaceId &&
      settings.ORDER_OUTSIDE_PJP_REQUIRE_REASON !== false &&
      contextReason.trim().length < 5
    ) {
      return 'Isi alasan order tanpa PJP minimal 5 karakter.';
    }
    if (!pending) {
      for (const item of orderItems) {
        const current = products.find((p) => p.id === item.product.id);
        if (!current) return 'Produk tidak tersedia di katalog. Muat ulang dahulu.';
        const issue = priceOverrideError(current.price, item.product.price, settings);
        if (issue) return `${current.name}: ${issue}`;
      }
    }
    return '';
  };

  const handleSubmit = async () => {
    if (saving || !stop) return;
    const validationError = validateBeforeSubmit();
    if (validationError) {
      setError(validationError);
      return;
    }

    const itemsPayload = orderItems.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.qty,
      qty: item.qty,
      price: item.product.price,
      unitPrice: item.product.price,
      unit: item.product.unit ?? null,
      baseUnit: item.product.baseUnit ?? null,
      unitsPerUnit: item.product.unitsPerUnit ?? null,
      subtotal: item.product.price * item.qty,
    }));

    const payload = pending || {
      stopId: stop.id,
      ...(stop.id
        ? {}
        : {
            outletId: stop.outletId,
            contextReason: contextReason.trim() || undefined,
            ...(adminPlaceId ? { adminPlaceId } : {}),
          }),
      requestId: crypto.randomUUID(),
      code,
      items: itemsPayload,
      paymentType,
      expectedTotal: pricing.totalValue,
      priceOverrideReason: priceOverrideReason.trim() || undefined,
      expectedTermDays: terms,
      pricing,
      totalAmount: pricing.totalValue,
    };

    if (!draft.persist((prev) => ({ ...prev, pending: payload }))) {
      setError(
        'Browser tidak dapat menyimpan identitas pengiriman. Kosongkan ruang browser lalu coba lagi.'
      );
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSubmitOrder(payload);
      sessionStorage.removeItem(requestKey);
      setPending(null);
      draft.clear();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resumeEditing = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await ordersApi.findRequest(pending.requestId);
      if (result.data) {
        setError('Order sudah tersimpan. Kirim ulang order yang sama untuk mengambil hasilnya.');
        return;
      }
      draft.setValue({
        code: pending.code,
        orderItems,
        paymentType: pending.paymentType,
        priceOverrideReason: pending.priceOverrideReason || '',
        contextReason: pending.contextReason || '',
      });
      sessionStorage.removeItem(requestKey);
      setPending(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    products,
    setProducts,
    settings,
    draft,
    pending,
    code,
    setCode,
    saving,
    error,
    loadingProducts,
    productLoadError,
    loadCatalog,
    orderItems,
    setOrderItems,
    paymentType,
    setPaymentType,
    updateProductQty,
    pricing,
    hasPriceOverride,
    approval,
    priceOverrideReason,
    contextReason,
    terms,
    handleSubmit,
    resumeEditing,
  };
}
