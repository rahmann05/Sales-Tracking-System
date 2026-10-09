import {prisma} from '../../../config/prisma.js';
import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
import {z} from 'zod';
const daysMs=86400000;
// Archive markers keep decisions and deduplication readable by existing consumers.
export async function retainSystemHistory({db=prisma,now=new Date(),policyFor=effectivePolicy}={}){
 const global=(await policyFor({})).values,days=Number(global.AUDIT_ACTIVE_RETENTION_DAYS)||0;
 let archived=0,notifications=0;
 if(days>0)archived=(await db.auditEvent.updateMany({where:{archivedAt:null,createdAt:{lt:new Date(+now-days*daysMs)}},data:{archivedAt:now}})).count;
 let cursor;
 do{
  const users=await db.user.findMany({where:cursor?{id:{gt:cursor}}:{},orderBy:{id:'asc'},take:100,select:{id:true,role:true,supervisorId:true}});
  for(const actor of users){
   const limit=Number((await policyFor(actor)).values.NOTIFY_READ_RETENTION_DAYS)||0;
   if(limit>0)notifications+=(await db.notification.deleteMany({where:{userId:actor.id,isRead:true,createdAt:{lt:new Date(+now-limit*daysMs)},OR:[{delivery:{is:null}},{delivery:{is:{state:{in:['SENT','SKIPPED']}}}}]}})).count;
  }
  cursor=users.length===100?users.at(-1).id:null;
 }while(cursor);
 return {archived,notifications};
}
const query=z.object({state:z.enum(['ACTIVE','ARCHIVED','ALL']).default('ACTIVE'),cursor:z.string().min(1).optional(),type:z.string().trim().max(100).optional()}).strict();
export async function listSystemAudit(raw){
 const {state,cursor,type}=query.parse(raw);
 const where={...(state==='ACTIVE'?{archivedAt:null}:state==='ARCHIVED'?{archivedAt:{not:null}}:{}),...(type?{entityType:type}:{})};
 const rows=await prisma.auditEvent.findMany({where,select:{id:true,entityType:true,entityId:true,actorName:true,action:true,createdAt:true,archivedAt:true},orderBy:[{createdAt:'desc'},{id:'desc'}],take:51,...(cursor?{cursor:{id:cursor},skip:1}:{})});
 return {items:rows.slice(0,50),nextCursor:rows.length>50?rows[49].id:null,state};
}
