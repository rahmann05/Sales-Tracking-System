import {assertSalesAccess} from '../../../utils/team-scope.js';
import {createCollectionFollowUp} from './collection-follow-up.service.js';
/** validateOffPjpAttendance - single-responsibility service (extracted from off-pjp.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { OFF_PJP_STATUS, NOTIFICATION_TYPES } from "../../../utils/constants.js";
import { createNotification } from "../../notifications/notifications.service.js";
import {reviewPeople} from '../../config/services/approval-readiness.service.js';
import {assertVisitReview} from './visit-review-permissions.js';

/**
 * Supervisor validates an off-PJP attendance.
 */
export const validateOffPjpAttendance = async (id, supervisorId, approved, rejectionNote) => {
  if(typeof approved!=='boolean'||rejectionNote!==undefined&&(typeof rejectionNote!=='string'||rejectionNote.length>2000))throw new AppError('Keputusan atau catatan kunjungan tidak valid',400);
  if(!approved&&!rejectionNote?.trim())throw new AppError('Alasan penolakan wajib',400);
  const newStatus = approved ? OFF_PJP_STATUS.APPROVED : OFF_PJP_STATUS.REJECTED;
  return prisma.$transaction(async tx=>{
  const subject=await tx.offPjpAttendance.findUnique({where:{id},select:{userId:true}});
  if(!subject)throw new AppError('Data absen luar RJP tidak ditemukan',404);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`staff:${subject.userId}`}))`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
  const reviewer=(await reviewPeople(tx)).find(person=>person.id===supervisorId);
  assertVisitReview(reviewer,'OFF_PJP',subject.userId);
  await assertSalesAccess(reviewer,subject.userId,tx);
  const record=await tx.offPjpAttendance.findUnique({where:{id}});
  if(record.status!==OFF_PJP_STATUS.PENDING)throw new AppError('Kunjungan sudah diproses',409);
  const changed=await tx.offPjpAttendance.updateMany({where:{id,status:OFF_PJP_STATUS.PENDING},data:{status:newStatus,validatedBy:supervisorId,validatedAt:new Date(),rejectionNote:rejectionNote?.trim()||null}});
  if(!changed.count)throw new AppError('Kunjungan sudah diproses',409);
  const result = await tx.offPjpAttendance.findUnique({
    where: { id },
  });
  if(approved)await createCollectionFollowUp(tx,result,'OFF_PJP');
  await tx.auditEvent.create({data:{entityType:'OFF_PJP',entityId:id,action:approved?'APPROVE_VISIT':'REJECT_VISIT',actorId:reviewer.id,actorName:reviewer.name,before:{status:record.status},after:{status:result.status,note:rejectionNote?.trim()||null,manualSalesStatus:result.manualSalesStatus}}});
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
  },{timeout:15000});
};
