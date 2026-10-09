import {processValue} from '../config/services/process-policy.service.js';
import {prisma} from '../../config/prisma.js';
import {AppError} from '../../utils/errors.js';
import {randomUUID} from 'node:crypto';
import {assertSalesAccess} from '../../utils/team-scope.js';
import {notifyFollowUp} from './follow-up-notification.service.js';
export async function followUpScope(user, db = prisma) {
  if (user.role === 'ADMIN') return { followUp: { path: ['status'], string_contains: '' } };
  const team = user.role === 'SUPERVISOR' ? await db.user.findMany({ where: { supervisorId: user.id, role: 'SALES', deletedAt: null }, select: { id: true } }) : [];
  return { OR: [{ userId: user.id, followUp: { path: ['status'], string_contains: '' } },
    { followUp: { path: ['ownerId'], equals: user.id } },
    ...team.map(sales => ({ followUp: { path: ['ownerId'], equals: sales.id } })),
    ...(user.role === 'SUPERVISOR' ? [{ user: { supervisorId: user.id }, followUp: { path: ['status'], string_contains: '' } }] : [])] };
}

export const listFollowUps=async(user,{status='ALL',page=1,limit=50}={})=>{
  if(!['ALL','OPEN','SUBMITTED','DONE'].includes(status))throw new AppError('Status tindak lanjut tidak valid',400);
  const current=Math.max(1,Math.floor(Number(page)||1)),size=Math.min(200,Math.max(1,Math.floor(Number(limit)||50)));
  return prisma.staffActivity.findMany({where:{AND:[await followUpScope(user),...(status==='ALL'?[]:[{followUp:{path:['status'],equals:status}}])]},select:{id:true,outletName:true,followUp:true,policySnapshot:true,user:{select:{name:true}}},orderBy:[{checkInAt:'asc'},{id:'asc'}],skip:(current-1)*size,take:size});
};
export const completeFollowUp=(id,user,note,evidence)=>prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`follow-up:${id}`}))`;
  const record=await tx.staffActivity.findFirst({where:{id,...await followUpScope(user,tx)}});
  if(!record?.followUp)throw new AppError('Tindak lanjut tidak ditemukan',404);
  if(record.followUp.status!=='OPEN')throw new AppError('Tugas sudah dikirim atau selesai',409);
  if(record.followUp.ownerId!==user.id)throw new AppError('Hanya PIC yang dapat mengirim hasil tugas',403);
  if(typeof note!=='string'||!note.trim()||note.trim().length>4000)throw new AppError('Catatan penyelesaian wajib, maksimal 4000 karakter',400);
  if(await processValue(record,'FOLLOW_UP_REQUIRE_EVIDENCE',true)&&(typeof evidence!=='string'||!evidence.trim()||evidence.trim().length>2000))throw new AppError('Bukti atau referensi hasil wajib diisi, maksimal 2000 karakter',400);
  const submission={id:randomUUID(),at:new Date().toISOString(),actorId:user.id,note:note.trim(),evidence:typeof evidence==='string'?evidence.trim():''};
  const needsReview=await processValue(record,'FOLLOW_UP_REQUIRE_REVIEW',true);
  const followUp={...record.followUp,status:needsReview?'SUBMITTED':'DONE',...(!needsReview?{completedAt:submission.at,completedBy:user.id,completionNote:submission.note,completionSource:'POLICY_NO_REVIEW'}:{}),submission,history:[...(record.followUp.history||[]),{action:'SUBMITTED',...submission}]};
  const updated = await tx.staffActivity.update({where:{id},data:{followUp}});
  await notifyFollowUp(tx, updated, needsReview?'SUBMITTED':'COMPLETED_BY_POLICY', user.id);
  return updated;
});

export const reviewFollowUp=(id,user,{decision,note,submissionId})=>prisma.$transaction(async tx=>{
  if(!['ADMIN','SUPERVISOR'].includes(user.role))throw new AppError('Pemeriksaan hanya oleh Admin atau SPV',403);
  if(!['ACCEPT','RETURN'].includes(decision)||typeof note!=='string'||!note.trim()||note.trim().length>2000)throw new AppError('Keputusan dan catatan pemeriksaan wajib diisi',400);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`follow-up:${id}`}))`;
  const record=await tx.staffActivity.findFirst({where:{id,...await followUpScope(user,tx)}});
  if(!record?.followUp)throw new AppError('Tindak lanjut tidak ditemukan',404);
  const f=record.followUp;
  if(f.ownerId===user.id)throw new AppError('Hasil tugas sendiri harus diperiksa pengguna lain',403);
  await assertSalesAccess(user,f.ownerId,tx);
  if(f.status!=='SUBMITTED'||!submissionId||f.submission?.id!==submissionId)throw new AppError('Hasil sudah berubah atau sudah diperiksa. Muat ulang tugas.',409);
  const review={decision,note:note.trim(),submissionId,actorId:user.id,at:new Date().toISOString()};
  const followUp={...f,status:decision==='ACCEPT'?'DONE':'OPEN',review,
    ...(decision==='ACCEPT'?{completedAt:review.at,completedBy:user.id,completionNote:f.submission.note}:{}),
    history:[...(f.history||[]),{action:decision==='ACCEPT'?'ACCEPTED':'RETURNED',...review}]};
  const updated = await tx.staffActivity.update({where:{id},data:{followUp}});
  await notifyFollowUp(tx, updated, decision === 'ACCEPT' ? 'ACCEPTED' : 'RETURNED', user.id);
  return updated;
});
