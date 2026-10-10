import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {policyNotification} from '../../notifications/services/notification-policy.service.js';
import {assertOrderOperation} from './order-operation-permissions.js';
export async function setOrderPromise(id,data,actor){
 assertOrderOperation(actor,'PROMISE');
 return prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`order:${id}`}))`;
  const order=await tx.order.findUnique({where:{id}});
  if(!order||order.deletedAt||order.status==='REJECTED')throw new AppError('Order tidak aktif',409);
  const updated=await tx.order.update({where:{id:order.id},data:{promisedAt:new Date(data.promisedAt),history:[...order.history,{action:'PROMISE',actorId:actor.id,at:new Date().toISOString(),note:data.note,before:order.promisedAt?.toISOString()||null,after:data.promisedAt}]}});
  await policyNotification(tx,{data:{userId:order.createdBy,type:'ORDER_PROMISE',title:'Janji pengiriman order',message:data.note,payload:{orderId:order.id,promisedAt:data.promisedAt,previousPromisedAt:order.promisedAt?.toISOString()||null,actorId:actor.id}}});
  return updated;
 });
}
