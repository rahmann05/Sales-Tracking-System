import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { assertSalesAccess } from '../../../utils/team-scope.js';
import {processValue} from '../../config/services/process-policy.service.js';
import {resolveIdentity} from '../../roles/role-assignment.service.js';
import { createNotification } from '../../notifications/notifications.service.js';
export const handleUnlockRequest = async (requestId,handlerId,approved) => {
  if (typeof approved !== 'boolean') throw new AppError('Keputusan persetujuan tidak valid',400);
  const record=await prisma.user.findUnique({where:{id:handlerId}});
  const handler=record&&!record.deletedAt?await resolveIdentity(record):null;
  if (!handler || !['ADMIN','SUPERVISOR'].includes(handler.role)||handler.permissions?.can_unlock_absensi!==true) throw new AppError('Khusus admin/supervisor',403);
  const request = await prisma.outletUnlockRequest.findUnique({where:{id:requestId},include:{outlet:true}});
  if (!request) throw new AppError('Pengajuan tidak ditemukan',404);
  await assertSalesAccess(handler,request.requestedBy);
  if (handler.id === request.requestedBy) throw new AppError('Tidak boleh menyetujui pengajuan sendiri',403);
  const role=await processValue(request,'UNLOCK_REVIEWER_ROLE','BOTH');
  if(role!=='BOTH'&&role!==handler.role)throw new AppError('Aturan pengajuan tidak mengizinkan role Anda memeriksa.',403);
  const minutes = await processValue(request,'UNLOCK_VALIDITY_MINUTES',120);
  const visits = Number(await processValue(request,'UNLOCK_MAX_VISITS_PER_APPROVAL',0))||0;
  const expiresAt = approved ? new Date(Date.now()+minutes*60000) : null;
  return prisma.$transaction(async tx => {
  const changed = await tx.outletUnlockRequest.updateMany({where:{id:requestId,status:'PENDING_APPROVAL'},data:{status:approved?'APPROVED':'REJECTED',handledBy:handlerId,handledAt:new Date(),expiresAt}});
  if (!changed.count) throw new AppError('Pengajuan sudah diproses',409);
  const message = approved ? `Pengecualian untuk ${request.outlet.name} disetujui selama ${minutes} menit, khusus akun Anda. ${visits?`Maksimal ${visits} kunjungan; masuk dan keluar pada stop yang sama dihitung sekali.`:'Jumlah kunjungan tidak dibatasi selama izin berlaku.'}` : `Pengajuan pengecualian untuk ${request.outlet.name} ditolak.`;
  await createNotification(request.requestedBy,approved?'UNLOCK_APPROVED':'UNLOCK_REJECTED','Keputusan pengecualian absensi',message,{outletId:request.outletId,expiresAt,salesId:request.requestedBy},tx);
  return {message,approved,expiresAt};
  });
};
