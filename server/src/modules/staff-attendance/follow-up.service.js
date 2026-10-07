import {prisma} from '../../config/prisma.js';
import {AppError} from '../../utils/errors.js';
export const followUpScope=user=>user.role==='ADMIN'?{followUp:{path:['status'],string_contains:''}}:{OR:[{userId:user.id,followUp:{path:['status'],string_contains:''}},{followUp:{path:['ownerId'],equals:user.id}}]};
export const listFollowUps=user=>prisma.staffActivity.findMany({where:followUpScope(user),select:{id:true,outletName:true,followUp:true},orderBy:{checkInAt:'desc'},take:200});
export const completeFollowUp=(id,user,note)=>prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`follow-up:${id}`}))`;
  const record=await tx.staffActivity.findFirst({where:{id,...followUpScope(user)}});
  if(!record?.followUp)throw new AppError('Tindak lanjut tidak ditemukan',404);
  if(record.followUp.status==='DONE')throw new AppError('Tindak lanjut sudah selesai',409);
  if(!note?.trim())throw new AppError('Catatan penyelesaian wajib',400);
  const followUp={...record.followUp,status:'DONE',completedAt:new Date().toISOString(),completedBy:user.id,completionNote:note.trim(),history:[...(record.followUp.history||[]),{action:'COMPLETED',actorId:user.id,at:new Date().toISOString(),note:note.trim()}]};
  return tx.staffActivity.update({where:{id},data:{followUp}});
});
