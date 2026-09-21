/**
 * Order Mapper
 * Single Responsibility: Normalize server Order payloads (Prisma shape)
 * into the flat UI shape consumed by Admin/Supervisor/Sales order views.
 */

export const mapServerOrderItem = (item = {}) => ({
  productId: item.productId,
  productName: item.product?.name || item.productName || 'Produk',
  qty: item.quantity ?? item.qty ?? 0,
  unitPrice: item.unitPrice ?? 0,
  subtotal: item.subtotal ?? (item.unitPrice || 0) * (item.quantity || 0),
});

export const mapServerOrder = (o = {}) => ({
  id: o.id,
  dailyStopId: o.pjpStopId,
  outletName: o.pjpStop?.outlet?.name || o.outletName || '',
  salesName: o.createdByUser?.name || o.salesName || '',
  createdAt: o.createdAt
    ? new Date(o.createdAt).toISOString().replace('T', ' ').substring(0, 16)
    : '',
  items: (o.items || []).map(mapServerOrderItem),
  totalAmount: o.totalValue ?? o.totalAmount ?? 0,
  paymentType: o.paymentType || 'CASH',
  status: o.status,
  approvedByName: o.approvedByUser?.name || null,
  rejectionReason: o.rejectionReason || null,
});