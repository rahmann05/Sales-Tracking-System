import { AppError } from '../../../utils/errors.js';
import {
  orderPricing,
  hasCompleteTaxTerms,
  resolveTaxIncluded,
} from '../../../../../shared/order-pricing.mjs';
export function mapInvoiceCommercial(invoice, items, order) {
  const orders = Array.isArray(order) ? order : order ? [order] : [];
  const referenced = orders.filter(
    (o) =>
      (invoice.items || []).some((line) => {
        const item = items.find((i) => i.lineId === line.lineId);
        return item && o.items.some((i) => i.id === (item.sourceOrderItemId || item.lineId));
      }) ||
      (!(invoice.items || []).length && (invoice.sourceOrderIds || []).includes(o.id))
  );
  if (orders.length > 1 && !referenced.length)
    throw new AppError('Faktur gabungan harus memetakan barang ke order asal.', 400);
  const terms = (o) => {
    const sum = o.items.reduce((n, i) => n + i.subtotal, 0);
    return [
      o.taxRatePercent,
      o.taxIncluded ??
        (Math.abs(o.totalValue - sum) < 0.005
          ? true
          : Math.abs(o.totalValue - sum - o.taxAmount) < 0.005
            ? false
            : null),
      o.policySnapshot?.values?.ORDER_TAX_ROUNDING_MODE || 'NEAREST',
    ];
  };
  if (referenced.some((o) => JSON.stringify(terms(o)) !== JSON.stringify(terms(referenced[0]))))
    throw new AppError(
      'Aturan pajak order berbeda. Pisahkan pemetaan ke faktur masing-masing.',
      409
    );
  order = referenced[0] || orders[0] || null;
  const subtotal = order?.items.reduce((n, i) => n + i.subtotal, 0);
  const included =
    order?.taxIncluded ??
    (order && Math.abs(order.totalValue - subtotal) < 0.005
      ? true
      : order && Math.abs(order.totalValue - subtotal - order.taxAmount) < 0.005
        ? false
        : null);
  const mappedItems = (invoice.items || []).map((line) => {
    const packingItem = items.find((i) => i.lineId === line.lineId);
    if (!packingItem) throw new AppError('Barang faktur tidak ditemukan di packing', 400);
    const source = orders
      .flatMap((o) => o.items)
      .find((i) => i.id === (packingItem.sourceOrderItemId || packingItem.lineId));
    if (orders.length && !source) throw new AppError('Baris faktur tidak sesuai order sumber', 409);
    return { ...line, ...(source ? { unitPrice: source.unitPrice } : {}) };
  });
  const taxRoundingMode =
    order?.policySnapshot?.values?.ORDER_TAX_ROUNDING_MODE || invoice.taxRoundingMode || 'NEAREST';
  const taxRatePercent = order ? order.taxRatePercent : invoice.taxRatePercent;
  const rawTaxIncluded = order ? included : invoice.taxIncluded;
  const taxIncluded = resolveTaxIncluded(taxRatePercent, rawTaxIncluded);
  const hasExplicitAmount =
    invoice.totalAmount !== undefined && invoice.totalAmount !== null && invoice.totalAmount !== '';
  const canAutoPrice =
    orders.length > 0 &&
    !hasExplicitAmount &&
    mappedItems.length > 0 &&
    mappedItems.every((i) => Number.isFinite(i.unitPrice) && i.unitPrice >= 0) &&
    hasCompleteTaxTerms(taxRatePercent, taxIncluded);
  return {
    ...invoice,
    items: mappedItems,
    taxRoundingMode,
    ...(order ? { taxRatePercent, taxIncluded } : {}),
    ...(canAutoPrice
      ? {
          totalAmount: orderPricing(mappedItems, taxRatePercent, taxIncluded, taxRoundingMode)
            .totalValue,
        }
      : {}),
  };
}
