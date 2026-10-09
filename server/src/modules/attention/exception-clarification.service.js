import {prisma} from '../../config/prisma.js';
import {AppError} from '../../utils/errors.js';
import {createNotification} from '../notifications/services/create-notification.service.js';

export const myOperationalExceptions=actor=>prisma.operationalException.findMany({where:{userId:actor.id,status:'OPEN',kind:{not:'MANUAL_RESULT'}},orderBy:{createdAt:'desc'},take:100});
export async function clarifyOperationalException(id,body,actor){
 if(typeof body.note!=='string'||body.note.trim().length<5||body.note.length>2000)throw new AppError('Penjelasan 5–2000 karakter wajib diisi',400);
 return prisma.$transaction(async db=>{
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`exception:${id}`}))`;
  const record=await db.operationalException.findUnique({where:{id}});
  if(!record||record.userId!==actor.id)throw new AppError('Permintaan klarifikasi tidak ditemukan',404);
  if(record.status!=='OPEN'||record.decision?.value!=='REQUIRES_CORRECTION')throw new AppError('Pengecualian ini tidak sedang meminta klarifikasi',409);
  const last=record.details.clarification;
  if(last?.requestAt===record.decision.at)throw new AppError('Penjelasan sudah dikirim dan menunggu pemeriksaan. SPV dapat meminta klarifikasi tambahan.',409);
  const clarification={note:body.note.trim(),actorId:actor.id,at:new Date().toISOString(),requestAt:record.decision.at};
  const result=await db.operationalException.update({where:{id},data:{details:{...record.details,clarification,clarifications:[...(record.details.clarifications||[]),clarification]}}});
  await db.auditEvent.create({data:{entityType:'OPERATIONAL_EXCEPTION',entityId:id,action:'CLARIFY',actorId:actor.id,actorName:actor.name,before:{status:record.status},after:clarification}});
  const person=await db.user.findUnique({where:{id:actor.id},select:{supervisorId:true}});
  if(person?.supervisorId)await createNotification(person.supervisorId,'EXCEPTION_CLARIFIED','Penjelasan presensi diterima',`${actor.name} telah menjelaskan presensi yang belum lengkap.`,{exceptionId:id},db);
  return result;
 });
}
