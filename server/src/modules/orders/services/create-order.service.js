import {createHash} from 'node:crypto';
import {unitSnapshot} from '../../../../../shared/product-units.mjs';
import {withUserTransaction} from '../../../utils/user-transaction.js';
import {orderPricing} from '../../../../../shared/order-pricing.mjs';
import { getDynamicConfig } from '../../config/config.service.js';
import { resolveBusinessCode } from '../../config/services/business-code.service.js';
/** createOrder - single-responsibility service (extracted from orders.service.js). */
import { AppError } from '../../../utils/errors.js';
import { createBulkNotificationByRoles } from "../../notifications/notifications.service.js";
import { ORDER_STATUS, ROLES, NOTIFICATION_TYPES } from '../../../utils/constants.js';
import {emitToUser} from '../../../config/socket.js';
import {SOCKET_EVENTS} from '../../../utils/constants.js';


export const createOrder = async (salesId, pjpStopId, items, paymentType, manualCode, options = {}) => {
  if(!items?.length||new Set(items.map(i=>i.productId)).size!==items.length)throw new AppError('Produk order wajib diisi tanpa baris ganda',400);
  const requestHash=createHash('sha256').update(JSON.stringify({salesId,pjpStopId,items,paymentType,manualCode})).digest('hex');
  let notifications=[];
  const saved=await withUserTransaction(salesId,async tx=>{
  if(options.requestId){const existing=await tx.order.findUnique({where:{requestId:options.requestId},include:{items:{include:{product:true}},pjpStop:{include:{outlet:true}},createdByUser:{select:{id:true,name:true}}}});if(existing){if(existing.createdBy!==salesId||existing.requestHash!==requestHash)throw new AppError('Identitas pengiriman sudah dipakai untuk isi order berbeda. Periksa order sebelumnya.',409);return existing;}}
  const stop = await tx.pjpStop.findUnique({
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
  const orderItemsData = [];

  for (const item of items) {
    const product = await tx.product.findUnique({ where: { id: item.productId } });
    if (!product || product.deletedAt) {
      throw new AppError(`Produk dengan ID ${item.productId} tidak ditemukan`, 404);
    }
    if(product.unit&&['unit','baseUnit','unitsPerUnit'].some(key=>item[key]===undefined))throw new AppError('Satuan katalog harus dikonfirmasi pada order. Muat ulang katalog.',409);

    if (!allowPriceOverride && item.unitPrice !== undefined && item.unitPrice !== product.price) throw new AppError('Harga produk berubah. Muat ulang katalog sebelum mengirim order.', 409);
    const unitPrice = allowPriceOverride ? (item.unitPrice ?? product.price) : product.price;
    for(const key of ['unit','baseUnit','unitsPerUnit'])if(item[key]!==undefined&&(item[key]??null)!==(product[key]??null))throw new AppError('Satuan atau isi kemasan berubah. Muat ulang katalog dan periksa jumlah order.',409);
    const subtotal = unitPrice * item.quantity;

    orderItemsData.push({ productId: item.productId, quantity: item.quantity, unitPrice, subtotal,productName:product.name,productSku:product.sku,...unitSnapshot(product) });
  }

  const payment=paymentType||stop.outlet.paymentType||await getDynamicConfig('DEFAULT_PAYMENT_TYPE','CASH');
  const termOfPaymentDays=payment==='TOP'?(stop.outlet.termOfPaymentDays||await getDynamicConfig('DEFAULT_TERM_OF_PAYMENT_DAYS',30)):0;
  const taxRatePercent=await getDynamicConfig('TAX_RATE_PERCENT',11);
  const taxIncluded=await getDynamicConfig('ORDER_PRICES_INCLUDE_TAX',true);
  const {totalValue,taxAmount}=orderPricing(orderItemsData,taxRatePercent,taxIncluded);
  if(options.expectedTotal!=null&&Math.abs(options.expectedTotal-totalValue)>0.005)throw new AppError('Total berubah karena harga/pajak. Muat ulang dan konfirmasi jumlah baru.',409);
  if(options.expectedTermDays!=null&&options.expectedTermDays!==termOfPaymentDays)throw new AppError('Termin berubah. Muat ulang dan konfirmasi syarat pembayaran.',409);
  const order = await tx.order.create({
    data: {
      code: await resolveBusinessCode('ORDER',manualCode,{db:tx}),
      requestId:options.requestId||null,requestHash:options.requestId?requestHash:null,taxIncluded,
      customerSnapshot:{id:stop.outlet.id,name:stop.outlet.name,address:stop.outlet.address,outletCode:stop.outlet.outletCode,channel:stop.outlet.channel,subChannel:stop.outlet.subChannel},
      history:[{action:'CREATE',actorId:salesId,at:new Date().toISOString(),paymentType:payment,previousPaymentType:stop.outlet.paymentType}],
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

  notifications=await createBulkNotificationByRoles(
    [ROLES.SUPERVISOR, ROLES.ADMIN],
    NOTIFICATION_TYPES.ORDER_CREATED,
    'Order Baru Perlu Persetujuan',
    `Sales ${order.createdByUser.name} menginput order Rp ${totalValue.toLocaleString('id-ID')} di outlet ${stop.outlet.name}`,
    { orderId: order.id, salesId },
    tx
  );

  return order;
  });
  for(const {userId,...notice} of notifications||[]){try{emitToUser(userId,SOCKET_EVENTS.NOTIFICATION,notice);}catch{console.warn('Order saved; live notification delivery failed. Notification remains in inbox.');}}
  return saved;
};
