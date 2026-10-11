import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {reviewPeople} from '../../config/services/approval-readiness.service.js';
import {canDomainAction} from '../../../../../shared/domain-permissions.mjs';
import {getDynamicConfig} from '../../config/config.service.js';
import {existingOperation,operationHash} from '../../../utils/operation-request.js';
import {policyNotifications} from '../../notifications/services/notification-policy.service.js';
import {canHandleIssue,issueRecipients,issueResponsibleRole,issueForOwner} from '../../../../../shared/operational-issues.mjs';

const locationCase=issue=>(issue.history||[]).some(event=>['LOCATION_DISCREPANCY','TRIP_ENDPOINT_DISCREPANCY'].includes(event.action));
async function identity(db,user){const person=(await reviewPeople(db)).find(person=>person.id===user.id&&!person.deletedAt);if(!person)throw new AppError('Akun tidak aktif',403);return person;}
export async function issueScope(db,user){
 if(['ADMIN','KEPALA_GUDANG'].includes(user.role)){if(user.permissions?.can_monitor_delivery===false)throw new AppError('Akses pemantauan diperlukan',403);return {};}
 if(user.role==='SUPIR'){if(user.permissions?.can_access_driver_map===false)throw new AppError('Akses pengiriman diperlukan',403);const routes=await db.deliveryRoute.findMany({where:{driverId:user.id},select:{id:true}});return {OR:[{ownerId:user.id},{routeId:{in:routes.map(route=>route.id)}}]};}
 if(!['SALES','SUPERVISOR'].includes(user.role))throw new AppError('Akses penanganan masalah tidak tersedia',403);
 const sales=user.role==='SALES'?[user.id]:(await db.user.findMany({where:{supervisorId:user.id,role:'SALES',deletedAt:null},select:{id:true}})).map(person=>person.id);
 const [orders,visits]=await Promise.all([db.order.findMany({where:{deletedAt:null,createdBy:{in:sales}},select:{id:true}}),db.pjpStop.findMany({where:{pjp:{userId:{in:sales}}},select:{id:true}})]);
 return {OR:[{createdById:user.id},{orderId:{in:orders.map(order=>order.id)}},{salesVisitId:{in:visits.map(visit=>visit.id)}}]};
}
async function referenceContext(db,data,user){
 const context={};
 if(data.routeId){context.route=await db.deliveryRoute.findUnique({where:{id:data.routeId}});if(!context.route)throw new AppError('Perjalanan tidak ditemukan',404);if(user.role==='SUPIR'&&context.route.driverId!==user.id)throw new AppError('Perjalanan bukan tugas Anda',403);}
 if(data.packingListId){context.packing=await db.packingList.findUnique({where:{id:data.packingListId}});if(!context.packing)throw new AppError('Dokumen tidak ditemukan',404);}
 if(data.orderId){context.order=await db.order.findUnique({where:{id:data.orderId},include:{createdByUser:{select:{supervisorId:true}}}});if(!context.order||context.order.deletedAt)throw new AppError('Order tidak ditemukan',404);}
 if(data.salesVisitId){context.visit=await db.pjpStop.findUnique({where:{id:data.salesVisitId},include:{pjp:{include:{user:{select:{supervisorId:true}}}}}});if(!context.visit)throw new AppError('Kunjungan tidak ditemukan',404);}
 if(['SALES','SUPERVISOR'].includes(user.role)){
  if(data.routeId||data.packingListId)throw new AppError('Laporkan melalui order atau kunjungan yang terkait dengan Anda.',403);
  const sources=[context.order&&{salesId:context.order.createdBy,supervisorId:context.order.createdByUser?.supervisorId},context.visit&&{salesId:context.visit.pjp.userId,supervisorId:context.visit.pjp.user.supervisorId}].filter(Boolean);
  if(!sources.length||sources.some(source=>user.role==='SALES'?source.salesId!==user.id:source.supervisorId!==user.id))throw new AppError('Transaksi di luar cakupan Anda',403);
 }
 if(user.role==='SUPIR'&&(!context.route||data.orderId||data.salesVisitId||data.packingListId))throw new AppError('Supir melaporkan masalah melalui perjalanan yang ditugaskan.',403);
 if(context.packing&&context.route&&!await db.deliveryStop.findFirst({where:{deliveryRouteId:context.route.id,packingListId:context.packing.id}}))throw new AppError('Dokumen tidak termasuk perjalanan ini',400);
 if(context.order&&context.visit&&context.order.pjpStopId!==context.visit.id)throw new AppError('Order bukan bagian kunjungan ini',400);
 if(context.order&&context.packing&&![context.packing.sourceOrderId,...(context.packing.sourceOrderIds||[])].includes(context.order.id))throw new AppError('Order bukan sumber dokumen ini',400);
 if(context.order&&context.route&&!context.packing){const documents=await db.deliveryStop.findMany({where:{deliveryRouteId:context.route.id},include:{packingList:true}});if(!documents.some(stop=>[stop.packingList.sourceOrderId,...(stop.packingList.sourceOrderIds||[])].includes(context.order.id)))throw new AppError('Order bukan bagian perjalanan ini',400);}
 return context;
}
export async function listIssues(user,query={}){
 user=await identity(prisma,user);const scope=await issueScope(prisma,user),reference=Object.fromEntries(['routeId','packingListId','orderId','salesVisitId'].filter(key=>query[key]).map(key=>[key,query[key]]));
 const rows=await prisma.deliveryIssue.findMany({where:{AND:[scope,reference,...(query.status==='ALL'?[]:[{status:'OPEN'}])]},orderBy:[{createdAt:'desc'},{id:'asc'}]});
 const people=await reviewPeople(prisma);
 return {issues:rows.map(issue=>({...issue,ownerName:people.find(person=>person.id===issue.ownerId)?.name||null})),people:['ADMIN','KEPALA_GUDANG'].includes(user.role)?people.filter(person=>!person.deletedAt&&canDomainAction(person,'RESOLVE_DELIVERY_ISSUE')):[]};
}
export const createIssue=(data,user)=>prisma.$transaction(async db=>{
 await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
 user=await identity(db,user);if(!canDomainAction(user,'REPORT_OPERATIONAL_ISSUE'))throw new AppError('Akun tidak berizin melaporkan masalah',403);
 if(await getDynamicConfig('FEATURE_FOLLOW_UP_MODE','ACTIVE')!=='ACTIVE')throw new AppError('Laporan baru sedang dijeda oleh Admin; masalah yang sudah tercatat tetap dapat diselesaikan.',409);
 const hash=operationHash(data),previous=await existingOperation(db,'deliveryIssue',data.requestId,hash,user.id,{lock:true});if(previous)return previous;
 const context=await referenceContext(db,data,user);
 if(context.route?.closedAt||context.route?.cancelledAt)throw new AppError('Perjalanan sudah ditutup. Laporkan keluhan melalui order terkait.',409);
 const responsibleRole=issueResponsibleRole(data,data.kind);
 const supervisorId=context.visit?.pjp.user.supervisorId||null;
 const people=await reviewPeople(db),ownerId=data.ownerId||null;
 let assignedRole=responsibleRole;
 if(ownerId){if(!['ADMIN','KEPALA_GUDANG'].includes(user.role))throw new AppError('Pengalihan penerima hanya oleh Admin/gudang',403);const owner=people.find(person=>person.id===ownerId&&!person.deletedAt),candidate=issueForOwner({responsibleRole,supervisorId},owner);if(!owner||owner.role==='SUPIR'||!canHandleIssue(owner,candidate))throw new AppError('Petugas harus aktif, berizin, dan sesuai cakupan masalah',409);assignedRole=candidate.responsibleRole;}
 const hours=Number(await getDynamicConfig('DELIVERY_ISSUE_DEFAULT_HOURS',24));
 const role=assignedRole==='SUPERVISOR'&&!people.some(person=>person.id===supervisorId&&canHandleIssue(person,{responsibleRole:'SUPERVISOR',supervisorId}))?'ADMIN':assignedRole;
 const {kind,...recordData}=data;
 const issue=await db.deliveryIssue.create({data:{...recordData,ownerId,responsibleRole:role,supervisorId,requestHash:data.requestId?hash:null,dueAt:data.dueAt?new Date(data.dueAt):hours>0?new Date(Date.now()+hours*3600000):null,createdById:user.id,history:[{action:'CREATE',kind:kind||'CONTEXT',actorId:user.id,actorName:user.name,at:new Date().toISOString()}]}});
 const recipients=issueRecipients(issue,people);
 if(!recipients.length)throw new AppError('Tidak ada penerima aktif yang berizin. Minta Admin memulihkan akses tim.',409);
 await policyNotifications(db,{data:recipients.filter(person=>person.id!==user.id).map(person=>({userId:person.id,type:'DELIVERY_FOLLOW_UP',title:issue.title,message:issue.reason,payload:{issueId:issue.id,routeId:issue.routeId,orderId:issue.orderId,salesVisitId:issue.salesVisitId}}))});
 return issue;
},{isolationLevel:'ReadCommitted',timeout:15000});

export async function changeIssue(id,data,user){return prisma.$transaction(async db=>{
 await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
 await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`issue:${id}`}))`;
 user=await identity(db,user);const scope=await issueScope(db,user),issue=await db.deliveryIssue.findFirst({where:{AND:[{id},scope]}});
 if(!issue)throw new AppError('Masalah tidak ditemukan dalam cakupan Anda',404);
 const independent=locationCase(issue),admin=user.role==='ADMIN',warehouse=user.role==='KEPALA_GUDANG',supervisor=user.role==='SUPERVISOR'&&issue.responsibleRole==='SUPERVISOR';
 const eligible=canHandleIssue(user,issue);
 const reporterReply=data.action==='NOTE'&&issue.createdById===user.id&&canDomainAction(user,'REPORT_OPERATIONAL_ISSUE');
 if(['NOTE','REASSIGN','REOPEN','RESOLVE'].includes(data.action)&&!data.note?.trim())throw new AppError('Jelaskan tindakan atau hasil pemeriksaan.',400);
 if(independent&&!admin&&!reporterReply)throw new AppError('Perbedaan titik harus diperiksa Admin berdasarkan bukti.',403);
 if(!eligible&&!reporterReply)throw new AppError('Anda dapat melihat perkembangan; penanganan dilakukan penerima yang berwenang.',403);
 if(issue.ownerId&&issue.ownerId!==user.id&&!admin&&data.action!=='NOTE')throw new AppError('Masalah sedang ditangani petugas lain. Minta Admin mengalihkan penanganan.',409);
 if(data.action==='REOPEN'&&!admin&&!warehouse&&!supervisor)throw new AppError('Pembukaan kembali hanya oleh pemeriksa yang berwenang',403);
 if(data.action==='REOPEN'?issue.status!=='DONE':issue.status!=='OPEN')throw new AppError('Status sudah berubah. Muat ulang masalah.',409);
 let change={};
 if(data.action==='CLAIM')change.ownerId=user.id;
 if(data.action==='REASSIGN'){
  if(!admin&&!warehouse&&!supervisor)throw new AppError('Tidak berizin mengalihkan penanganan',403);
  if(data.ownerId){const owner=(await reviewPeople(db)).find(person=>person.id===data.ownerId),candidate=issueForOwner(issue,owner);if(!owner||owner.role==='SUPIR'||!canHandleIssue(owner,candidate))throw new AppError('Penerima tidak aktif/berizin atau di luar cakupan masalah',409);change.responsibleRole=candidate.responsibleRole;}
  change.ownerId=data.ownerId||null;
 }
 if(data.action==='RESOLVE'){
  if(independent&&!/^(MASTER_POINT_WRONG|DRIVER_ATTENDANCE_INVALID|GPS_INACCURATE|LEGITIMATE_DIFFERENCE):\s*.{10,}$/s.test(data.note||''))throw new AppError('Pilih kesimpulan dan tulis alasan/bukti minimal 10 karakter. Jika belum jelas, biarkan terbuka.',400);
  change={status:'DONE',resolution:data.note,resolvedAt:new Date()};
 }
 if(data.action==='REOPEN')change={status:'OPEN',resolvedAt:null};
 const entry={action:data.action,actorId:user.id,actorName:user.name,at:new Date().toISOString(),note:data.note||'',before:{ownerId:issue.ownerId,status:issue.status,responsibleRole:issue.responsibleRole},after:{ownerId:change.ownerId===undefined?issue.ownerId:change.ownerId,status:change.status||issue.status,responsibleRole:change.responsibleRole||issue.responsibleRole}};
 const updated=await db.deliveryIssue.update({where:{id},data:{...change,history:[...(issue.history||[]),entry]}});
 if(['NOTE','REASSIGN','RESOLVE','REOPEN'].includes(data.action)){const people=await reviewPeople(db),recipients=[...new Set([issue.createdById,...(data.action==='RESOLVE'?[]:issueRecipients(updated,people).map(person=>person.id))].filter(value=>value&&value!==user.id&&people.some(person=>person.id===value&&!person.deletedAt)))];await policyNotifications(db,{data:recipients.map(userId=>({userId,type:'DELIVERY_FOLLOW_UP',title:data.action==='RESOLVE'?'Masalah telah diselesaikan':data.action==='REOPEN'?'Masalah dibuka kembali':data.action==='NOTE'?'Informasi penanganan diperbarui':'Penanganan dialihkan',message:issue.title,payload:{issueId:id,routeId:issue.routeId,orderId:issue.orderId}}))});}
 return updated;
},{isolationLevel:'ReadCommitted',timeout:15000});}
export const resolveIssue=(id,resolution,user)=>changeIssue(id,{action:'RESOLVE',note:resolution},user);
