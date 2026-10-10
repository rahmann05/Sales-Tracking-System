import {z} from 'zod';
import {prisma} from '../../config/prisma.js';
import {AppError} from '../../utils/errors.js';
import {prepareAutomaticFollowUp} from './automatic-follow-up.service.js';
import {followUpActor} from './follow-up-access.service.js';
import {parseAuditItems,DEFAULT_AUDIT_ITEMS} from '../../../../shared/supervision-checklist.mjs';
import {processValue} from '../config/services/process-policy.service.js';
import {notifyFollowUp} from './follow-up-notification.service.js';
export async function retryAutomaticFollowUp(id,user,raw){
 const data=z.object({ownerId:z.string().uuid().optional(),reason:z.string().trim().min(5).max(1000)}).strict().parse(raw);
 return prisma.$transaction(async db=>{
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
  const {actor}=await followUpActor(db,user,'assign');
  const record=await db.staffActivity.findUnique({where:{id}});
  if(!record||actor.role!=='ADMIN'&&record.userId!==actor.id)throw new AppError('Temuan supervisi tidak tersedia dalam akses Anda.',403);
  if(record.followUp)return record;
  if(record.checklist?.autoFollowUp?.status!=='BLOCKED')throw new AppError('Tidak ada tugas otomatis tertunda pada kunjungan ini.',409);
  const items=parseAuditItems(await processValue(record,'SPV_AUDIT_ITEMS',DEFAULT_AUDIT_ITEMS));
  const followUp=await prepareAutomaticFollowUp(db,actor,record,items,record.checklist,data.ownerId);
  if(!followUp)throw new AppError('Temuan tidak lagi memenuhi pemicu tugas otomatis.',409);
  followUp.history[0].note=data.reason;
  const checklist={...record.checklist};delete checklist.autoFollowUp;
  const result=await db.staffActivity.update({where:{id},data:{followUp,checklist}});
  await db.auditEvent.create({data:{entityType:'FOLLOW_UP',entityId:id,action:'RETRY_AUTO_ASSIGN',actorId:actor.id,actorName:actor.name,before:{blocked:record.checklist.autoFollowUp},after:followUp}});
  await notifyFollowUp(db,result,'ASSIGNED',actor.id);return result;
 });
}
