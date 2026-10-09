import {validateProductUnits} from '../product-units.js';
/** createProduct - single-responsibility service (extracted from products.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { resolveBusinessCode } from '../../config/services/business-code.service.js';


export const createProduct = async (data) => {
  data={...data,...validateProductUnits(data)};
  const sku = await resolveBusinessCode('PRODUCT_SKU',data.sku);
  const code = await resolveBusinessCode('PRODUCT',data.code,{optional:true});
  if (await prisma.product.findUnique({where:{sku}})) throw new AppError('SKU produk sudah digunakan',409);
  return await prisma.product.create({ data: { ...data, sku, code, stock: 0 } });
};
