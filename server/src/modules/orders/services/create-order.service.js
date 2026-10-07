import { getDynamicConfig } from '../../config/config.service.js';
/** createOrder - single-responsibility service (extracted from orders.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { createBulkNotificationByRoles } from "../../notifications/notifications.service.js";
import { ORDER_STATUS, ROLES, NOTIFICATION_TYPES } from '../../../utils/constants.js';


export const createOrder = async (salesId, pjpStopId, items, paymentType) => {
  const stop = await prisma.pjpStop.findUnique({
    where: { id: pjpStopId },
    include: { pjp: true, attendances: true, outlet: true },
  });

  if (!stop) throw new AppError('Stop PJP tidak ditemukan', 404);

  if (stop.pjp.userId !== salesId) {
    throw new AppError('Anda hanya dapat menginput order pada outlet PJP milik Anda sendiri', 403);
  }

  const hasActiveCheckIn = stop.attendances.some((a) => a.userId === salesId && a.type === 'IN');
  if (!hasActiveCheckIn) {
    throw new AppError('Input order hanya valid jika Anda sudah melakukan Absen IN pada outlet ini', 400);
  }

  if (stop.attendances.some(a => a.type === 'OUT')) throw new AppError('Kunjungan sudah selesai. Order harus dibuat sebelum absen keluar.', 409);
  const allowPriceOverride = await getDynamicConfig('SALES_ALLOW_PRICE_OVERRIDE', false);
  // Build order items and calculate total
  let totalValue = 0;
  const orderItemsData = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || product.deletedAt) {
      throw new AppError(`Produk dengan ID ${item.productId} tidak ditemukan`, 404);
    }

    if (!allowPriceOverride && item.unitPrice !== undefined && item.unitPrice !== product.price) throw new AppError('Harga produk berubah. Muat ulang katalog sebelum mengirim order.', 409);
    const unitPrice = allowPriceOverride ? (item.unitPrice ?? product.price) : product.price;
    const subtotal = unitPrice * item.quantity;
    totalValue += subtotal;

    orderItemsData.push({ productId: item.productId, quantity: item.quantity, unitPrice, subtotal });
  }

  const payment=paymentType||stop.outlet.paymentType||await getDynamicConfig('DEFAULT_PAYMENT_TYPE','CASH');
  const termOfPaymentDays=payment==='TOP'?(stop.outlet.termOfPaymentDays||await getDynamicConfig('DEFAULT_TERM_OF_PAYMENT_DAYS',30)):0;
  const taxRatePercent=await getDynamicConfig('TAX_RATE_PERCENT',11);
  const taxIncluded=await getDynamicConfig('ORDER_PRICES_INCLUDE_TAX',true);
  const taxAmount=Math.round(taxIncluded?totalValue*taxRatePercent/(100+taxRatePercent):totalValue*taxRatePercent/100);
  if(!taxIncluded)totalValue+=taxAmount;
  const order = await prisma.order.create({
    data: {
      pjpStopId,
      createdBy: salesId,
      totalValue,
      paymentType:payment,termOfPaymentDays,taxRatePercent,taxAmount,
      status: ORDER_STATUS.PENDING_APPROVAL,
      items: { create: orderItemsData },
    },
    include: {
      items: { include: { product: true } },
      pjpStop: { include: { outlet: true } },
      createdByUser: { select: { id: true, name: true } },
    },
  });

  await createBulkNotificationByRoles(
    [ROLES.SUPERVISOR, ROLES.ADMIN],
    NOTIFICATION_TYPES.ORDER_CREATED,
    'Order Baru Perlu Persetujuan',
    `Sales ${order.createdByUser.name} menginput order Rp ${totalValue.toLocaleString('id-ID')} di outlet ${stop.outlet.name}`,
    { orderId: order.id }
  );

  return order;
};
