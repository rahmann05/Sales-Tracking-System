/** createPackingList - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { generatePackingListCode } from './delivery.helpers.js';

/**
 * Create packing list with invoices
 */
export const createPackingList = async (data, userId) => {
  const { outletId, totalCartons, totalWeight, notes, invoices } = data;

  // Verify outlet exists
  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet) throw new AppError('Outlet tidak ditemukan', 404);

  const code = await generatePackingListCode();

  const packingList = await prisma.packingList.create({
    data: {
      code,
      outletId,
      totalCartons,
      totalWeight,
      notes,
      createdById: userId,
      invoices: {
        create: invoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          outletId,
          totalAmount: inv.totalAmount,
          totalCartons: inv.totalCartons || 1,
          notes: inv.notes,
        })),
      },
    },
    include: {
      outlet: { select: { id: true, name: true, address: true, outletCode: true } },
      invoices: true,
      createdBy: { select: { id: true, name: true } },
    },
  });

  return packingList;
};
