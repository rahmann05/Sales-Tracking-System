/** updateProduct - single-responsibility service (extracted from products.service.js). */
import { prisma } from '../../../config/prisma.js';
import {validateProductUnits} from '../product-units.js';
import {AppError} from '../../../utils/errors.js';
import { validateCodeUpdate } from '../../config/services/business-code.service.js';


export const updateProduct = async (id, data,actor={}) => {
  data={...data,...validateProductUnits(data)};
  if (data.sku!==undefined) data={...data,sku:await validateCodeUpdate('PRODUCT_SKU',data.sku,id)};
  if (data.code!==undefined) data={...data,code:await validateCodeUpdate('PRODUCT',data.code,id)};
  return prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`product:${id}`}))`;
    const before=await tx.product.findUnique({where:{id}});
    if(!before||before.deletedAt)throw new AppError('Produk tidak ditemukan',404);
    const after=await tx.product.update({where:{id},data});
    if(['unit','baseUnit','unitsPerUnit'].some(key=>before[key]!==after[key])){
      const snapshot=p=>({unit:p.unit,baseUnit:p.baseUnit,unitsPerUnit:p.unitsPerUnit,price:p.price});
      await tx.auditEvent.create({data:{entityType:'PRODUCT',entityId:id,action:'CHANGE_UNIT',actorId:actor.id||null,actorName:actor.name||null,before:snapshot(before),after:snapshot(after)}});
    }
    return after;
  });
};
