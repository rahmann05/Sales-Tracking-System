import {unlockKindAllowed} from '../../../../../shared/unlock-policy.mjs';
import {capturePolicySnapshot} from '../../config/services/process-policy.service.js';
import {resolveIdentity} from '../../roles/role-assignment.service.js';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { assertOutletAccess } from '../../../utils/team-scope.js';
import { createNotification } from '../../notifications/notifications.service.js';
export const requestOutletUnlock = async (outletId,userId,reason,kind='BOTH') => {
  if (typeof reason!=='string'||reason.trim().length<3||reason.trim().length>2000) throw new AppError('Alasan pengecualian wajib diisi',400);
  const user = await prisma.user.findUnique({where:{id:userId}});
  const outlet = await prisma.outlet.findUnique({where:{id:outletId},include:{cluster:true}});
  if (!outlet || outlet.deletedAt) throw new AppError('Outlet tidak ditemukan',404);
  await assertOutletAccess(user,outletId);
  const snapshot=await capturePolicySnapshot(),values=snapshot.values;
  if(!unlockKindAllowed(kind,values))throw new AppError('Jenis pengecualian tidak diizinkan oleh parameter Anda.',422);
  const request = await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`unlock:${outletId}:${userId}`}))`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`unlock-frequency:${userId}`}))`;
    const limit=Number(values.UNLOCK_MAX_REQUESTS_PER_WINDOW)||0;
    if(limit&&await tx.outletUnlockRequest.count({where:{requestedBy:userId,createdAt:{gte:new Date(Date.now()-(Number(values.UNLOCK_REQUEST_WINDOW_HOURS)||24)*3600000)}}})>=limit)throw new AppError(`Batas ${limit} pengajuan dalam ${values.UNLOCK_REQUEST_WINDOW_HOURS||24} jam tercapai. Tunggu jendela berikutnya.`,429);
    if (await tx.outletUnlockRequest.findFirst({where:{outletId,requestedBy:userId,status:'PENDING_APPROVAL'}})) throw new AppError('Pengajuan Anda masih menunggu keputusan',409);
    const request = await tx.outletUnlockRequest.create({data:{outletId,requestedBy:userId,reason:reason.trim(),kind,policySnapshot:snapshot},include:{outlet:{select:{id:true,name:true}},requestedByUser:{select:{id:true,name:true}}}});
  const reviewers = await tx.user.findMany({where:{deletedAt:null}});
  const eligible=[];
  for(const record of reviewers){const candidate=await resolveIdentity(record);if(candidate.permissions?.can_unlock_absensi===true&&(candidate.role==='ADMIN'||candidate.role==='SUPERVISOR'&&candidate.id===user.supervisorId)&&((values.UNLOCK_REVIEWER_ROLE||'BOTH')==='BOTH'||values.UNLOCK_REVIEWER_ROLE===candidate.role))eligible.push(candidate);}
  if(!eligible.length)throw new AppError('Tidak ada pemeriksa aktif berizin untuk permohonan ini. Hubungi Admin.',409);
  for (const r of eligible) await createNotification(r.id,'UNLOCK_REQUEST','Pengajuan pengecualian absensi',`${user.name}: ${outlet.name}. ${reason}`,{unlockRequestId:request.id,outletId,salesId:userId},tx);
  return request;
  });
  return request;
};
