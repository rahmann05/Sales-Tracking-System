import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { assertOutletAccess } from '../../../utils/team-scope.js';
import { createNotification } from '../../notifications/notifications.service.js';
export const requestOutletUnlock = async (outletId,userId,reason) => {
  if (!reason?.trim()) throw new AppError('Alasan pengecualian wajib diisi',400);
  const user = await prisma.user.findUnique({where:{id:userId}});
  const outlet = await prisma.outlet.findUnique({where:{id:outletId},include:{cluster:true}});
  if (!outlet || outlet.deletedAt) throw new AppError('Outlet tidak ditemukan',404);
  await assertOutletAccess(user,outletId);
  const request = await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`unlock:${outletId}:${userId}`}))`;
    if (await tx.outletUnlockRequest.findFirst({where:{outletId,requestedBy:userId,status:'PENDING_APPROVAL'}})) throw new AppError('Pengajuan Anda masih menunggu keputusan',409);
    return tx.outletUnlockRequest.create({data:{outletId,requestedBy:userId,reason:reason.trim()},include:{outlet:{select:{id:true,name:true}},requestedByUser:{select:{id:true,name:true}}}});
  });
  const reviewers = await prisma.user.findMany({where:{deletedAt:null,OR:[{role:'ADMIN'},{id:outlet.cluster.supervisorId||'',role:'SUPERVISOR'}]},select:{id:true}});
  await Promise.all(reviewers.map(r=>createNotification(r.id,'UNLOCK_REQUEST','Pengajuan pengecualian absensi',`${user.name}: ${outlet.name}. ${reason}`,{unlockRequestId:request.id,outletId})));
  return request;
};
