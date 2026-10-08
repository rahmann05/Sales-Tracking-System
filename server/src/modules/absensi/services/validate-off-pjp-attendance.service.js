import {assertSalesAccess} from '../../../utils/team-scope.js';
import {createCollectionFollowUp} from './collection-follow-up.service.js';
/** validateOffPjpAttendance - single-responsibility service (extracted from off-pjp.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { OFF_PJP_STATUS, NOTIFICATION_TYPES } from "../../../utils/constants.js";
import { createNotification } from "../../notifications/notifications.service.js";

/**
 * Supervisor validates an off-PJP attendance.
 */
export const validateOffPjpAttendance = async (id, supervisorId, approved, rejectionNote) => {
  const record = await prisma.offPjpAttendance.findUnique({ where: { id } });
  if (!record) throw new AppError('Data absen luar RJP tidak ditemukan', 404);
  if (record.status !== OFF_PJP_STATUS.PENDING) {
    throw new AppError(`Absen ini sudah diproses sebelumnya (Status: ${record.status})`, 409);
  }

  const reviewer=await prisma.user.findUnique({where:{id:supervisorId}});
  if(!reviewer||!['ADMIN','SUPERVISOR'].includes(reviewer.role)||reviewer.id===record.userId)throw new AppError('Tidak berwenang menyetujui kunjungan',403);
  await assertSalesAccess(reviewer,record.userId);
  if(!approved&&!rejectionNote?.trim())throw new AppError('Alasan penolakan wajib',400);
  const newStatus = approved ? OFF_PJP_STATUS.APPROVED : OFF_PJP_STATUS.REJECTED;

  const updated=await prisma.$transaction(async tx=>{
  const changed=await tx.offPjpAttendance.updateMany({where:{id,status:OFF_PJP_STATUS.PENDING},data:{status:newStatus,validatedBy:supervisorId,validatedAt:new Date(),rejectionNote:rejectionNote||null}});
  if(!changed.count)throw new AppError('Kunjungan sudah diproses',409);
  const result = await tx.offPjpAttendance.findUnique({
    where: { id },
  });
  if(approved)await createCollectionFollowUp(tx,result,'OFF_PJP');
  const notifTitle = approved ? 'Absen Luar RJP Divalidasi' : 'Absen Luar RJP Ditolak';
  const notifMsg = approved
    ? `Absen Anda di toko "${record.outletName}" telah divalidasi oleh Supervisor.`
    : `Absen Anda di toko "${record.outletName}" ditolak. Alasan: ${rejectionNote || '-'}.`;

  await createNotification(
    record.userId,
    approved ? NOTIFICATION_TYPES.OFF_PJP_VALIDATED : NOTIFICATION_TYPES.OFF_PJP_REJECTED,
    notifTitle,
    notifMsg,
    { offPjpAttendanceId: id }, tx
  );

  return result;
  });
  return updated;
};
