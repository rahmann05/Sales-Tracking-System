import {z} from 'zod';
import {prisma} from '../../config/prisma.js';
import {AppError} from '../../utils/errors.js';
import {reviewPeople} from '../config/services/approval-readiness.service.js';
import {effectivePolicy} from '../config/services/policy-resolver.service.js';
import {validateShiftCorrection} from '../../../../shared/shift-policy.mjs';
import {actionNames} from '../../../../shared/business-actions.mjs';

export const shiftCorrectionInput=z.object({action:z.enum(actionNames('SHIFT_CORRECTION')),revision:z.number().int().nonnegative(),reason:z.string().trim().min(5).max(2000),checkInAt:z.string().datetime().optional(),checkOutAt:z.string().datetime().nullable().optional()}).strict();
export async function pendingShiftCorrections(user){
 const actor=(await reviewPeople(prisma)).find(p=>p.id===user.id&&!p.deletedAt);
 if(actor?.role!=='ADMIN'||!['can_propose_shift_correction','can_review_shift_correction'].some(key=>actor.permissions[key]===true))throw new AppError('Akses koreksi shift tidak tersedia.',403);
 return prisma.staffActivity.findMany({where:{kind:'SHIFT',timeCorrection:{path:['pending','mode'],equals:'DUAL'}},include:{user:{select:{name:true,role:true}}},orderBy:[{checkInAt:'asc'},{id:'asc'}],take:100});
}
export async function correctShiftTime(id,raw,user){
 const data=shiftCorrectionInput.parse(raw);
 return prisma.$transaction(async db=>{
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
  const people=await reviewPeople(db),actor=people.find(p=>p.id===user.id&&!p.deletedAt);
  const permission=data.action==='PROPOSE'||data.action==='CANCEL'?'can_propose_shift_correction':'can_review_shift_correction';
  if(actor?.role!=='ADMIN'||actor.permissions[permission]!==true)throw new AppError('Koreksi shift memerlukan Admin aktif dengan izin tindakan ini.',403);
  let row=await db.staffActivity.findUnique({where:{id}});
  if(!row||row.kind!=='SHIFT')throw new AppError('Shift tidak ditemukan.',404);
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`staff:${row.userId}`}))`;
  row=await db.staffActivity.findUnique({where:{id}});
  const previous=row.timeCorrection||{revision:0,history:[]};
  if((previous.revision||0)!==data.revision)throw new AppError('Koreksi sudah berubah. Muat ulang sebelum melanjutkan.',409);
  const subject=people.find(p=>p.id===row.userId),values=(await effectivePolicy(subject||{},Date.now(),{fresh:true})).values;
  const mode=values.SHIFT_CORRECTION_MODE||'OFF',pending=previous.pending;
  const at=new Date().toISOString(),event={action:data.action,actorId:actor.id,actorName:actor.name,reason:data.reason,at};
  let accepted=previous.accepted||null,nextPending=pending||null;
  if(data.action==='PROPOSE'){
   if(mode==='OFF')throw new AppError('Koreksi shift dinonaktifkan pada profil staf ini.',409);
   if(pending)throw new AppError('Selesaikan atau batalkan usulan sebelumnya dahulu.',409);
   if(mode==='DUAL'&&!people.some(p=>!p.deletedAt&&p.role==='ADMIN'&&p.id!==actor.id&&p.id!==row.userId&&p.permissions.can_review_shift_correction===true))throw new AppError('Siapkan Admin pemeriksa berbeda yang aktif dan berizin sebelum mengusulkan.',409);
   if(!data.checkInAt)throw new AppError('Waktu masuk yang dilaporkan wajib diisi.',400);
   let times;try{times=validateShiftCorrection(row,data,values);}catch(e){throw new AppError(e.message,422);}
   const proposed={...times,proposedBy:actor.id,proposedByName:actor.name,proposedAt:at,reason:data.reason,mode,values:{SHIFT_CORRECTION_MAX_AGE_DAYS:values.SHIFT_CORRECTION_MAX_AGE_DAYS,SHIFT_CORRECTION_MAX_DURATION_HOURS:values.SHIFT_CORRECTION_MAX_DURATION_HOURS,SHIFT_DAY_CUTOFF_TIME:values.SHIFT_DAY_CUTOFF_TIME},source:'ADMIN_REPORTED_TIME'};
   if(mode==='ADMIN'){
    if(actor.id===row.userId||actor.permissions.can_review_shift_correction!==true)throw new AppError('Keputusan langsung memerlukan izin pemeriksa dan tidak boleh untuk shift sendiri.',403);
    accepted={...proposed,decidedBy:actor.id,decidedByName:actor.name,decidedAt:at,decisionReason:data.reason};
    event.action='ACCEPT_DIRECT';
   }else nextPending=proposed;
   event.proposal=proposed;
  }else{
   if(!pending)throw new AppError('Tidak ada usulan koreksi menunggu keputusan.',409);
   if(data.checkInAt!==undefined||data.checkOutAt!==undefined)throw new AppError('Pemeriksa tidak dapat mengubah waktu usulan. Tolak dan buat usulan baru.',400);
   if(data.action==='CANCEL'){
    if(pending.proposedBy!==actor.id)throw new AppError('Hanya pengusul yang dapat membatalkan usulan.',403);
   }else{
    if(actor.id===pending.proposedBy||actor.id===row.userId)throw new AppError('Pemeriksa harus berbeda dari pengusul dan pemilik shift.',403);
    if(data.action==='ACCEPT')accepted={...pending,decidedBy:actor.id,decidedByName:actor.name,decidedAt:at,decisionReason:data.reason};
   }
   event.proposal=pending;nextPending=null;
  }
  const after={revision:(previous.revision||0)+1,accepted,pending:nextPending,history:[...(previous.history||[]),event]};
  const result=await db.staffActivity.update({where:{id},data:{timeCorrection:after}});
  await db.auditEvent.create({data:{entityType:'SHIFT_TIME_CORRECTION',entityId:id,action:event.action,actorId:actor.id,actorName:actor.name,before:{timeCorrection:previous,actualIn:row.checkInAt,actualOut:row.checkOutAt},after:{timeCorrection:after,actualIn:row.checkInAt,actualOut:row.checkOutAt}}});
  return result;
 },{isolationLevel:'ReadCommitted',timeout:15000});
}
