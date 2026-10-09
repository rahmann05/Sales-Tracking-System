import {getDynamicConfig} from '../../config/config.service.js';
import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
import {prisma} from '../../../config/prisma.js';
import {randomUUID} from 'node:crypto';
export async function notificationEnabled(type='',values){
 const read=(key,fallback)=>values?values[key]??fallback:getDynamicConfig(key,fallback);
 if(await read('FEATURE_NOTIFICATIONS_MODE','ACTIVE')!=='ACTIVE')return false;
 const key=/ORDER/.test(type)?'NOTIFY_ORDER_EVENTS':/OUTLET|REGISTRATION/.test(type)?'NOTIFY_REGISTRATION_EVENTS':/FOLLOW_UP/.test(type)?'NOTIFY_FOLLOW_UP_EVENTS':/DELIVERY/.test(type)?'NOTIFY_DELIVERY_EVENTS':/EXCEPTION/.test(type)?'NOTIFY_EXCEPTION_EVENTS':null;
 return !key||await read(key,true);
}
export async function recipientValues(db,id){
 if(!db.user?.findUnique||!id)return undefined;
 const actor=await db.user.findUnique({where:{id},select:{id:true,role:true,supervisorId:true,deletedAt:true}});
 return actor&&!actor.deletedAt?(await effectivePolicy(actor)).values:{FEATURE_NOTIFICATIONS_MODE:'OFF'};
}
export async function policyNotification(db,args){
 if(db===prisma)return prisma.$transaction(tx=>policyNotification(tx,args));
 if(!await notificationEnabled(args.data.type,await recipientValues(db,args.data.userId)))return null;
 const row=await db.notification.create(args);
 if(db.notificationOutbox)await db.notificationOutbox.create({data:{notificationId:row.id}});
 return row;
}
export async function policyNotifications(db,args){
 if(db===prisma)return prisma.$transaction(tx=>policyNotifications(tx,args));
 const data=[],recipients=new Map();for(const row of args.data){if(!recipients.has(row.userId))recipients.set(row.userId,await recipientValues(db,row.userId));if(await notificationEnabled(row.type,recipients.get(row.userId)))data.push(row);}
 const accepted=data.map(row=>({...row,id:row.id||randomUUID()}));
 const result=accepted.length?await db.notification.createMany({...args,data:accepted}):{count:0};
 if(accepted.length&&db.notificationOutbox)await db.notificationOutbox.createMany({data:accepted.map(row=>({notificationId:row.id})),skipDuplicates:true});
 return {...result,accepted};
}
