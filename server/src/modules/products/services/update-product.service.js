/** updateProduct - single-responsibility service (extracted from products.service.js). */
import { prisma } from '../../../config/prisma.js';
import { validateCodeUpdate } from '../../config/services/business-code.service.js';


export const updateProduct = async (id, data) => {
  if (data.sku!==undefined) data={...data,sku:await validateCodeUpdate('PRODUCT_SKU',data.sku,id)};
  if (data.code!==undefined) data={...data,code:await validateCodeUpdate('PRODUCT',data.code,id)};
  return await prisma.product.update({ where: { id }, data });
};
