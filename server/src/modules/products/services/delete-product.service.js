/** deleteProduct - single-responsibility service (extracted from products.service.js). */
import { prisma } from '../../../config/prisma.js';


export const deleteProduct = async (id) => {
  return await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};
