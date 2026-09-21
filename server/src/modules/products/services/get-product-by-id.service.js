/** getProductById - single-responsibility service (extracted from products.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';


export const getProductById = async (id) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.deletedAt) {
    throw new AppError('Produk tidak ditemukan', 404);
  }
  return product;
};
