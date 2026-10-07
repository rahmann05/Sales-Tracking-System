import { getDynamicConfig } from '../../config/config.service.js';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';

export async function resolveSalesResult(payload) {
  const { orderAmount = 0, skuSold = 0, productIds = [] } = payload;
  const enabled = await getDynamicConfig('ATTENDANCE_ALLOW_MANUAL_SALES', true);
  if (!enabled && (orderAmount || skuSold || productIds.length)) throw new AppError('Input hasil penjualan saat absen dinonaktifkan admin', 403);
  if (!enabled) return { orderAmount: 0, skuSold: 0, salesProducts: [], isEffectiveCall: false };
  const ids = [...new Set(productIds)];
  const products = ids.length ? await prisma.product.findMany({ where: { id: { in: ids }, deletedAt: null }, select: { id: true, sku: true, name: true } }) : [];
  if (products.length !== ids.length) throw new AppError('Produk tidak tersedia. Muat ulang katalog.', 400);
  const count = products.length || skuSold;
  const manualSalesMode = await getDynamicConfig('MANUAL_SALES_REPORT_MODE', 'NOTES_ONLY');
  const manualSalesStatus = manualSalesMode === 'REQUIRE_APPROVAL' && (orderAmount > 0 || count > 0) ? 'PENDING' : 'NOTES_ONLY';
  return { manualSalesMode, manualSalesStatus, orderAmount, skuSold: count, salesProducts: products, isEffectiveCall: orderAmount > 0 || count > 0 };
}
