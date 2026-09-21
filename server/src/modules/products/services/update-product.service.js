/** updateProduct - single-responsibility service (extracted from products.service.js). */
import { prisma } from '../../../config/prisma.js';


export const updateProduct = async (id, data) => {
  return await prisma.product.update({ where: { id }, data });
};
