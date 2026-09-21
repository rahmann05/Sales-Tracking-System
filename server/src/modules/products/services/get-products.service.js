/** getProducts - single-responsibility service (extracted from products.service.js). */
import { prisma } from '../../../config/prisma.js';


export const getProducts = async (query = {}) => {
  const { search } = query;
  const where = { deletedAt: null };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  return await prisma.product.findMany({
    where,
    orderBy: { name: 'asc' },
  });
};
