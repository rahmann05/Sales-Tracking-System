import { z } from 'zod';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { assertSalesAccess } from '../../../utils/team-scope.js';
import { updateOutlet } from '../../outlets/services/update-outlet.service.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';
const schema=z.object({updatedAt:z.string().datetime(),reason:z.string().trim().min(10).max(1000),taxType:z.enum(['PKP','NON_PKP']),taxNumber:z.string().trim().max(30),taxName:z.string().trim().max(200),taxAddress:z.string().trim().max(1000),ownerName:z.string().trim().max(200)});
export async function updateRegistrationLegal(id,raw,actor) {
  const {updatedAt,reason,...data}=schema.parse(raw);
  if(data.taxType==='NON_PKP'&&data.taxNumber&&!/^\d{16}$/.test(data.taxNumber))throw new AppError('NIK harus terdiri dari 16 digit',400);
  const reg=await prisma.customerRegistration.findUnique({where:{id},include:{outlet:true}});
  if(!reg||reg.deletedAt)throw new AppError('Pengajuan tidak ditemukan',404);
  await assertSalesAccess(actor,reg.salesmanId);
  if(reg.updatedAt.getTime()!==new Date(updatedAt).getTime())throw new AppError('Pengajuan sudah berubah. Muat ulang.',409);
  if(reg.registrationStatus==='REGISTERED_ACTIVE') {
    if(!reg.outlet)throw new AppError('Pengajuan belum terhubung dengan master outlet',409);
    await updateOutlet(reg.outlet.id,{...data,updatedAt:reg.outlet.updatedAt.toISOString(),reason},actor);
  } else {
    const changed=await prisma.customerRegistration.updateMany({where:{id,updatedAt:new Date(updatedAt),registrationStatus:reg.registrationStatus},data});
    if(!changed.count)throw new AppError('Pengajuan sudah berubah. Muat ulang.',409);
  }
  broadcastCacheInvalidation('customer-registrations');
  return prisma.customerRegistration.findUnique({where:{id}});
}
