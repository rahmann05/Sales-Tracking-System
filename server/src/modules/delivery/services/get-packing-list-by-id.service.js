/** getPackingListById - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import {invoiceReconciliation} from '../../../../../shared/invoice-reconciliation.mjs';
import {packingBalance} from '../../../../../shared/packing.mjs';
import {withPackingDestinations} from './packing-destination.service.js';

/**
 * Get single packing list with details
 */
export const getPackingListById = async (id) => {
  const pl = await prisma.packingList.findUnique({
    where: { id },
    include: {
      outlet: { select: { id: true, name: true, outletCode: true, googleLocation:true,phone:true,clusterId:true,address:true,latitude:true, longitude: true } },
      invoices: true,
      createdBy: { select: { id: true, name: true } },
      deliveryStops: {
        include: {
          deliveryRoute: { select: { id: true, code: true, date: true, status: true,vehicle:{select:{id:true,code:true,name:true}},driver:{select:{id:true,name:true}} } },
        },
      },
    },
  });
  if (!pl) throw new AppError('Packing list tidak ditemukan', 404);
  return (await withPackingDestinations([{...packingBalance(pl),commercial:invoiceReconciliation(pl)}]))[0];
};
