/** createProduct - single-responsibility service (extracted from products.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';


export const createProduct = async (data) => {
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) {
    throw new AppError('SKU produk sudah digunakan', 400);
  }
  return await prisma.product.create({ data });
};
