import {z} from 'zod';
import {prisma} from '../../../config/prisma.js';
import {emitToUser,getIo} from '../../../config/socket.js';
import {SOCKET_EVENTS} from '../../../utils/constants.js';
import {AppError} from '../../../utils/errors.js';
import {notificationEnabled,recipientValues} from './notification-policy.service.js';
const pending=['PENDING','RETRY'];
export function notificationRetryDelay(attempt,base=10){
 return Math.min(3600000,Math.max(5,Math.min(3600,Number(base)||10))*1000*2**Math.max(0,Math.min(20,attempt-1)));
}
// Events are refresh hints, not delivery/read receipts. Duplicate hints are harmless.
// Inbox and outbox are inserted together; only committed rows become visible here.
export async function dispatchNotifications({db=prisma,emit=emitToUser,ready=()=>Boolean(getIo()),now=new Date(),notificationIds}={}){
 if(!ready())return {disabled:true,broadcast:0};
 const due={state:{in:pending},nextAttemptAt:{lte:now},...(notificationIds?{notificationId:{in:notificationIds}}:{})};
 const rows=await db.notificationOutbox.findMany({where:due,orderBy:[{nextAttemptAt:'asc'},{id:'asc'}],take:100,select:{id:true}});
 const result={broadcast:0,retry:0,failed:0,skipped:0};
 for(const row of rows)await db.$transaction(async tx=>{
  const claimed=await tx.notificationOutbox.updateMany({where:{...due,id:row.id},data:{state:'PROCESSING'}});
  if(!claimed.count)return;
  const job=await tx.notificationOutbox.findUnique({where:{id:row.id},include:{notification:true}}),notice=job.notification;
  const values=await recipientValues(tx,notice.userId),attempts=job.attempts+1;
  if(notice.isRead||values?.NOTIFY_REALTIME_ENABLED===false||!await notificationEnabled(notice.type,values)){
   await tx.notificationOutbox.update({where:{id:job.id},data:{state:'SKIPPED',processedAt:now,lastError:notice.isRead?'ALREADY_READ':'DISABLED_BY_POLICY'}});result.skipped++;return;
  }
  try{await emit(notice.userId,SOCKET_EVENTS.NOTIFICATION,notice);}catch{
   const maximum=Math.max(1,Math.min(20,Number(values?.NOTIFY_RETRY_MAX_ATTEMPTS)||5)),failed=attempts>=maximum;
   await tx.notificationOutbox.update({where:{id:job.id},data:{state:failed?'FAILED':'RETRY',attempts,nextAttemptAt:new Date(+now+notificationRetryDelay(attempts,values?.NOTIFY_RETRY_BASE_SECONDS)),processedAt:failed?now:null,lastError:'SOCKET_EMIT_FAILED'}});
   result[failed?'failed':'retry']++;return;
  }
  await tx.notificationOutbox.update({where:{id:job.id},data:{state:'SENT',attempts,processedAt:now,lastError:null}});result.broadcast++;
 });
 return result;
}
export async function notificationDeliveryStatus(){
 const [grouped,failed,oldest]=await Promise.all([
  prisma.notificationOutbox.groupBy({by:['state'],_count:{_all:true}}),
  prisma.notificationOutbox.findMany({where:{state:'FAILED'},orderBy:[{processedAt:'desc'},{id:'asc'}],take:20,include:{notification:{select:{title:true,type:true,createdAt:true}}}}),
  prisma.notificationOutbox.findFirst({where:{state:{in:pending}},orderBy:{createdAt:'asc'},select:{createdAt:true,nextAttemptAt:true}}),
 ]);
 return {counts:Object.fromEntries(grouped.map(row=>[row.state,row._count._all])),failed,oldest,checkedAt:new Date().toISOString()};
}
export async function retryNotificationDelivery(raw,actor){
 const data=z.object({id:z.string().uuid(),reason:z.string().trim().min(5).max(2000)}).strict().parse(raw);
 return prisma.$transaction(async tx=>{
  const updated=await tx.notificationOutbox.updateMany({where:{id:data.id,state:'FAILED'},data:{state:'PENDING',attempts:0,processedAt:null,nextAttemptAt:new Date(),lastError:null}});
  if(!updated.count)throw new AppError('Antrean sudah berubah atau tidak dalam status gagal. Perbarui tampilan.',409);
  await tx.auditEvent.create({data:{actorId:actor.id,actorName:actor.name,action:'NOTIFICATION_RETRY',entityType:'NOTIFICATION_OUTBOX',entityId:data.id,before:{state:'FAILED'},after:{state:'PENDING',reason:data.reason}}});
  return {id:data.id,state:'PENDING'};
 });
}
