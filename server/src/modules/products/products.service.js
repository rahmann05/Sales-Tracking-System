import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';

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

export const getProductById = async (id) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.deletedAt) {
    throw new AppError('Produk tidak ditemukan', 404);
  }
  return product;
};

export const createProduct = async (data) => {
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) {
    throw new AppError('SKU produk sudah digunakan', 400);
  }
  return await prisma.product.create({ data });
};

export const updateProduct = async (id, data) => {
  return await prisma.product.update({ where: { id }, data });
};

export const deleteProduct = async (id) => {
  return await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};
