import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {retainSystemHistory,listSystemAudit} from '../src/modules/notifications/services/history-retention.service.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag='HISTORY_TEST_'+randomUUID(),now=new Date(),old=new Date(+now-40*86400000),ids=[];
let actor,checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
try{
 actor=await prisma.user.create({data:{name:tag,email:tag+'@example.invalid',role:'ADMIN',password:'unused'}});
 for(const [state,isRead,createdAt] of [['SENT',true,old],['SKIPPED',true,old],['FAILED',true,old],['PENDING',true,old],['SENT',false,old],['SENT',true,now]]){
  const n=await prisma.notification.create({data:{userId:actor.id,type:tag,title:tag,message:'fixture',isRead,createdAt,delivery:{create:{state}}}});ids.push(n.id);
 }
 const audit=await prisma.auditEvent.create({data:{entityType:tag,entityId:tag,action:'TEST',actorId:actor.id,createdAt:old,before:{},after:{}}});
 const db={user:{findMany:()=>prisma.user.findMany({where:{id:actor.id}})},notification:prisma.notification,auditEvent:{updateMany:q=>prisma.auditEvent.updateMany({...q,where:{...q.where,entityType:tag}})}};
 const run=values=>retainSystemHistory({db,now,policyFor:async()=>({values})});
 eq(await run({}),{archived:0,notifications:0});
 eq(await run({AUDIT_ACTIVE_RETENTION_DAYS:30,NOTIFY_READ_RETENTION_DAYS:30}),{archived:1,notifications:2});
 eq((await prisma.notification.findMany({where:{id:{in:ids}},select:{id:true}})).map(n=>n.id).sort(),ids.slice(2).sort());
 eq((await listSystemAudit({state:'ACTIVE',type:tag})).items.length,0);
 const archived=await listSystemAudit({state:'ARCHIVED',type:tag});eq(archived.items[0].id,audit.id);eq(Object.hasOwn(archived.items[0],'after'),false);
 eq(await run({AUDIT_ACTIVE_RETENTION_DAYS:30,NOTIFY_READ_RETENTION_DAYS:30}),{archived:0,notifications:0});
 eq((await prisma.auditEvent.findUnique({where:{id:audit.id}})).action,'TEST');
 console.log(`C17 retention passed: ${checks} assertions; unread/failed/pending protected, archive remains available, repeat is idempotent.`);
}finally{
 if(actor){await prisma.notification.deleteMany({where:{userId:actor.id}});await prisma.auditEvent.deleteMany({where:{entityType:tag}});await prisma.user.delete({where:{id:actor.id}});}
 await prisma.$disconnect();
}
