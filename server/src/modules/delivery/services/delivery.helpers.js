/** Shared helpers for delivery services (internal). */
import { prisma } from '../../../config/prisma.js';

// ═══════════════════════════════════════════════════════════════
// PACKING LIST
// ═══════════════════════════════════════════════════════════════

/**
 * Generate unique packing list code: PL-YYYYMMDD-NNN
 */
export const generatePackingListCode = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `PL-${dateStr}-`;

  const lastPL = await prisma.packingList.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
  });

  const nextNum = lastPL ? parseInt(lastPL.code.slice(-3), 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
};

// ═══════════════════════════════════════════════════════════════
// DELIVERY ROUTE
// ═══════════════════════════════════════════════════════════════

/**
 * Generate unique delivery route code: DR-YYYYMMDD-A01
 */
export const generateRouteCode = async (date) => {
  const dateStr = new Date(date).toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `DR-${dateStr}-`;

  const lastRoute = await prisma.deliveryRoute.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
  });

  const nextNum = lastRoute ? parseInt(lastRoute.code.slice(-3), 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
};
