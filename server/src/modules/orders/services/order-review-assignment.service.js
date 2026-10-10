import {policyNotification} from '../../notifications/services/notification-policy.service.js';
import {orderReviewRole,reviewRoleAllowed} from '../../../../../shared/approval-workflow.mjs';
import {processValue} from '../../config/services/process-policy.service.js';
import {assertApprovalRole} from '../../config/services/approval-policy.service.js';
import {z} from 'zod';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {assertSalesAccess} from '../../../utils/team-scope.js';
import {inTransaction} from '../../../utils/in-transaction.js';
const keyFor=id=>`_ORDER_REVIEW:${id}`;
export function salesOrderHistory(history=[]){return history.filter(event=>!['ASSIGN_REVIEWER','RELEASE_REVIEWER'].includes(event.action)).map(event=>Object.fromEntries(Object.entries(event).filter(([name])=>!['assignmentRevision','assignedOwnerId','overrideReason'].includes(name))));}
const schema=z.object({ownerId:z.string().uuid().nullable(),dueAt:z.string().datetime().nullable(),revision:z.number().int().min(0),reason:z.string().trim().min(5).max(2000)}).strict();
function adminOnly(actor){if(actor?.role!=='ADMIN'||actor.permissions?.can_approve_order===false)throw new AppError('Penugasan pemeriksa hanya untuk Admin dengan izin approval order',403);}
const allowedOwner=(owner,order,sales,mode='BOTH')=>reviewRoleAllowed(orderReviewRole(order,{ORDER_APPROVAL_MODE:mode}),owner?.role)&&owner&&!owner.deletedAt&&owner.permissions?.can_approve_order!==false&&owner.id!==order.createdBy&&(owner.role==='ADMIN'||owner.role==='SUPERVISOR'&&!sales?.deletedAt&&sales?.supervisorId===owner.id);
export function orderReviewConflict(error){if(error?.code==='P2034')throw new AppError('Order atau penugasan berubah bersamaan. Muat ulang sebelum melanjutkan.',409);throw error;}
export async function saveOrderReviewAssignment(orderId,raw,actor,{db=prisma,validateOnly=false}={}){
  adminOnly(actor);const parsed=schema.safeParse(raw);if(!parsed.success)throw new AppError('PIC, tenggat, versi dan alasan penugasan tidak valid',400);
  const data=parsed.data;if(Boolean(data.ownerId)!==Boolean(data.dueAt))throw new AppError('PIC dan tenggat wajib diisi bersama, atau keduanya kosong untuk melepas penugasan',400);
  return inTransaction(db,async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`order:${orderId}`}))`;
    const order=await tx.order.findUnique({where:{id:orderId}});if(!order||order.deletedAt||order.status!=='PENDING_APPROVAL')throw new AppError('Order sudah diputuskan atau tidak aktif',409);
    const key=keyFor(orderId),previous=(await tx.systemConfig.findUnique({where:{key}}))?.value||null;
    if((previous?.revision||0)!==data.revision)throw new AppError('Penugasan sudah berubah. Muat ulang sebelum menyimpan.',409);
    const sales=await tx.user.findUnique({where:{id:order.createdBy}}),owner=data.ownerId?await tx.user.findUnique({where:{id:data.ownerId}}):null;
    if(data.ownerId&&!allowedOwner(owner,order,sales,await processValue(order,'ORDER_APPROVAL_MODE','BOTH')))throw new AppError('PIC harus Admin aktif atau SPV tim sales saat ini dengan izin approval; pemohon tidak dapat memeriksa sendiri',400);
    if(validateOnly)return previous||{revision:0,ownerId:null,dueAt:null};
    const value={...data,orderId,ownerName:owner?.name||null,ownerRole:owner?.role||null,revision:data.revision+1,assignedAt:new Date().toISOString(),assignedBy:actor.id,assignedByName:actor.name||null};
    await tx.systemConfig.upsert({where:{key},create:{key,value},update:{value}});
    await tx.auditEvent.create({data:{entityType:'ORDER_REVIEW_ASSIGNMENT',entityId:orderId,action:data.ownerId?'ASSIGN_REVIEWER':'RELEASE_REVIEWER',actorId:actor.id,actorName:actor.name||null,before:previous||{},after:value}});
    await tx.order.update({where:{id:orderId},data:{history:[...(order.history||[]),{action:data.ownerId?'ASSIGN_REVIEWER':'RELEASE_REVIEWER',actorId:actor.id,at:value.assignedAt,note:data.reason,assignmentRevision:value.revision,before:previous||null,after:value}]}});
    if(owner)await policyNotification(tx,{data:{userId:owner.id,type:'ORDER_REVIEW_ASSIGNED',title:'Tugas pemeriksaan order',message:`${order.code||order.id}: ${data.reason}`,payload:{orderId,assignmentRevision:value.revision,dueAt:data.dueAt}}});
    return value;
  });
}
export async function getOrderReviewAssignment(orderId,actor){
  if(!['ADMIN','SUPERVISOR'].includes(actor?.role))throw new AppError('Penugasan pemeriksa hanya tersedia untuk Admin/SPV',403);
  const order=await prisma.order.findUnique({where:{id:orderId}});if(!order||order.deletedAt)throw new AppError('Order tidak ditemukan',404);
  await assertSalesAccess(actor,order.createdBy);
  const sales=await prisma.user.findUnique({where:{id:order.createdBy}}),mode=await processValue(order,'ORDER_APPROVAL_MODE','BOTH');
  const [saved,history,people]=await Promise.all([
    prisma.systemConfig.findUnique({where:{key:keyFor(orderId)}}),
    prisma.auditEvent.findMany({where:{entityType:'ORDER_REVIEW_ASSIGNMENT',entityId:orderId},orderBy:[{createdAt:'desc'},{id:'desc'}],take:30}),
    actor.role==='ADMIN'?prisma.user.findMany({where:{deletedAt:null,OR:[{role:'ADMIN'},{id:sales?.supervisorId||'',role:'SUPERVISOR'}]},select:{id:true,name:true,role:true,deletedAt:true,permissions:true}}):[],
  ]);
  return {assignment:saved?.value||null,history,people:people.filter(person=>allowedOwner(person,order,sales,mode)).map(({id,name,role})=>({id,name,role})),status:order.status};
}
export async function loadOrderReviewAssignments(orders){
  if(!orders.length)return new Map();
  const keys=orders.map(order=>keyFor(order.id));
  const saved=await prisma.systemConfig.findMany({where:{key:{in:keys}},select:{key:true,value:true}});
  const records=saved.filter(row=>keys.includes(row.key)&&row.value?.orderId&&row.key===keyFor(row.value.orderId));
  const ids=[...new Set(records.map(row=>row.value.ownerId).filter(Boolean))];
  const owners=ids.length?await prisma.user.findMany({where:{id:{in:ids}},select:{id:true,name:true,role:true,deletedAt:true,permissions:true}}):[];
  return new Map(records.map(({value})=>{const order=orders.find(row=>row.id===value.orderId),owner=owners.find(row=>row.id===value.ownerId);
    return [value.orderId,{...value,ownerValid:!value.ownerId||Boolean(allowedOwner(owner,order,order.createdByUser)),ownerCurrentName:owner?.name||null}];}));
}
// Call only after taking the same order lock used for assignment and decisions.
export async function assertOrderReviewDecision(tx,order,actor,options={}){
  if(!actor||actor.deletedAt||!['ADMIN','SUPERVISOR'].includes(actor.role)||actor.permissions?.can_approve_order===false||actor.id===order.createdBy)throw new AppError('Tidak berwenang memeriksa order',403);
  const mode=await assertApprovalRole(order,'ORDER_APPROVAL_MODE',actor.role);
  const required=orderReviewRole(order,{ORDER_APPROVAL_MODE:mode});
  if(!reviewRoleAllowed(required,actor.role))throw new AppError(`Tahap pemeriksaan saat ini memerlukan ${required}`,409);
  await assertSalesAccess(actor,order.createdBy,tx);
  const assignment=(await tx.systemConfig.findUnique({where:{key:keyFor(order.id)}}))?.value||null;
  const revision=assignment?.revision||0;
  if(revision!==(options.assignmentRevision??0))throw new AppError('Penugasan pemeriksa sudah berubah. Muat ulang order sebelum memutuskan.',409);
  let overrideReason=null;
  const stageAssignment=assignment&&reviewRoleAllowed(required,assignment.ownerRole||'BOTH');
  if(assignment?.ownerId&&assignment.ownerId!==actor.id&&(mode!=='SEQUENTIAL'||stageAssignment)){
    if(actor.role!=='ADMIN')throw new AppError('Order ditugaskan kepada pemeriksa lain. Minta Admin mengalihkan penugasan.',403);
    if(typeof options.overrideReason!=='string'||options.overrideReason.trim().length<5||options.overrideReason.trim().length>2000)throw new AppError('Alasan pengambilalihan Admin wajib diisi, 5–2000 karakter',400);
    overrideReason=options.overrideReason.trim();
  }
  return {assignmentRevision:revision,assignedOwnerId:assignment?.ownerId||null,overrideReason};
}
