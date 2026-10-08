import { createHash } from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import { attentionDeadline, escalationReady } from '../../../../shared/attention-sla.mjs';
import { collectAttentionRows } from './attention.service.js';
import { loadAttentionPolicy } from './attention-sla.service.js';
import {AppError} from '../../utils/errors.js';

// Internal worker entry point; never takes rows or recipients from an HTTP request.
export async function escalateAttentionRows(rows,admins,{delayHours,now=Date.now()}={}){
  if(!admins.length||!Number.isInteger(delayHours)||delayHours<=0)return {notified:0};
  let notified=0;
  for(const row of rows.filter(value=>escalationReady(value,delayHours,now))){
    const deadline=new Date(attentionDeadline(row)).toISOString();
    const key=createHash('sha256').update(JSON.stringify([row.key,row.stage||row.category,deadline])).digest('hex');
    const sent=await prisma.$transaction(async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`attention-escalation:${key}`}))`;
      if(await tx.auditEvent.findFirst({where:{entityType:'SLA_ESCALATION',entityId:key,action:'NOTIFIED'},select:{id:true}}))return false;
      const payload={attentionKey:row.key,category:row.category,stage:row.stage||null,deadline,observedAt:new Date(now).toISOString(),reference:row.reference||null,activityId:row.activityId||null,exceptionId:row.exception?.id||null};
      await tx.notification.createMany({data:admins.map(admin=>({userId:admin.id,type:'SLA_ESCALATION',title:'Pekerjaan melewati batas eskalasi',message:`${row.title}. Tenggat ${new Date(deadline).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB. ${row.nextAction}. Status berdasarkan pemeriksaan ${new Date(now).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB; periksa antrean untuk status terbaru.`,payload}))});
      await tx.auditEvent.create({data:{entityType:'SLA_ESCALATION',entityId:key,action:'NOTIFIED',actorName:'Scheduler SLA',before:{},after:{...payload,recipientIds:admins.map(admin=>admin.id),delayHours}}});
      return true;
    });
    if(sent)notified++;
  }
  return {notified};
}
export async function runAttentionEscalation(){
  const policy=await loadAttentionPolicy(),delayHours=Number(policy.SLA_ESCALATION_DELAY_HOURS);
  if(!Number.isInteger(delayHours)||delayHours<=0)return {notified:0,disabled:true};
  const admins=await prisma.user.findMany({where:{role:'ADMIN',deletedAt:null},select:{id:true,name:true}});
  if(!admins.length)return {notified:0};
  const {rows}=await collectAttentionRows({...admins[0],role:'ADMIN'},policy);
  return escalateAttentionRows(rows,admins,{delayHours});
}
export async function listAttentionEscalations(actor,{page=1,limit=20,unread=true}={}){
  if(actor?.role!=='ADMIN')throw new AppError('Eskalasi hanya tersedia untuk Admin penerima',403);
  const where={userId:actor.id,type:'SLA_ESCALATION',...(unread?{isRead:false}:{})};
  const [items,total,unreadCount]=await Promise.all([
    prisma.notification.findMany({where,orderBy:[{createdAt:'desc'},{id:'desc'}],skip:(page-1)*limit,take:limit}),
    prisma.notification.count({where}),prisma.notification.count({where:{userId:actor.id,type:'SLA_ESCALATION',isRead:false}}),
  ]);
  return {items,total,unreadCount,page,limit};
}
