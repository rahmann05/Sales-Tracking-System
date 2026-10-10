import {prisma} from '../../config/prisma.js';
import {AppError} from '../../utils/errors.js';
import {assertSalesAccess} from '../../utils/team-scope.js';
import {flagVisit,visitSettings} from '../absensi/services/visit-session.service.js';
import {createNotification} from '../notifications/services/create-notification.service.js';
import {flagShiftRange} from '../staff-attendance/shift-range.service.js';
import {withUserTransaction} from '../../utils/user-transaction.js';
export async function scanMissingOut(db=prisma){
 const stops=await db.pjpStop.findMany({where:{status:'PENDING',attendances:{some:{type:'IN'},none:{type:'OUT'}}},include:{attendances:true,outlet:true,pjp:true}});
 for(const stop of stops){const p=await visitSettings(stop);const entered=stop.attendances.find(a=>a.type==='IN');if(p.requireOut&&Date.now()-+new Date(entered.timestamp)>(p.snapshot.values.SALES_MISSING_OUT_MINUTES||720)*60000)await flagVisit(db,stop,stop.pjp.userId,'TIME_LIMIT');}
 const shifts=await db.staffActivity.findMany({where:{kind:'SHIFT',checkOutAt:null}});
 for(const row of shifts){
  if(db===prisma)await withUserTransaction(row.userId,async tx=>{const current=await tx.staffActivity.findUnique({where:{id:row.id}});if(current)await flagShiftRange(tx,current);});
  else await flagShiftRange(db,row);
 }
}
export async function operationalExceptionRows(actor){
 if(!['ADMIN','SUPERVISOR'].includes(actor.role))return [];
 const records=await prisma.operationalException.findMany({where:{status:'OPEN'}});
 const rows=[];
 for(const record of records){
  try{await assertSalesAccess(actor,record.userId);}catch{continue;}
  const person=await prisma.user.findUnique({where:{id:record.userId},select:{name:true,supervisorId:true,supervisor:{select:{name:true}}}});
  rows.push({key:`operational:${record.id}`,category:'EXCEPTION',stage:'EXCEPTION',status:'PENDING',needsReview:true,title:`${record.details?.outletName||'Kegiatan'} · ${person?.name||'Staf'}`,since:record.createdAt,ownerId:person?.supervisorId,ownerName:person?.supervisor?.name,ownerSource:'TEAM_SUPERVISOR',responsibleRole:'SPV / ADMIN',nextAction:record.kind==='MANUAL_RESULT'?'Periksa hasil manual kegiatan':'Periksa bukti presensi yang belum lengkap',target:'EXCEPTION',exception:{id:record.id,kind:record.kind,applicantId:record.userId,applicantName:person?.name,reason:record.details?.source,decision:record.decision,...record.details},canDecide:record.userId!==actor.id});
 }
 return rows;
}
export async function resolveOperationalException(id,body,actor){
 if(!['ADMIN','SUPERVISOR'].includes(actor.role))throw new AppError('Khusus peninjau berwenang',403);
 if(!['ACKNOWLEDGED','REQUIRES_CORRECTION','APPROVED','REJECTED'].includes(body.decision)||typeof body.note!=='string'||body.note.trim().length<5)throw new AppError('Keputusan dan catatan minimal 5 karakter wajib diisi',400);
 return prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`exception:${id}`}))`;
  const record=await tx.operationalException.findUnique({where:{id}});
  if(!record)throw new AppError('Pengecualian tidak ditemukan',404);
  if(record.userId===actor.id)throw new AppError('Tidak dapat meninjau bukti sendiri',403);
  await assertSalesAccess(actor,record.userId,tx);
  if(record.status!=='OPEN')throw new AppError('Pengecualian sudah diproses',409);
  if(record.kind==='MANUAL_RESULT'){
   if(!['APPROVED','REJECTED'].includes(body.decision))throw new AppError('Pilih persetujuan atau penolakan hasil manual',400);
   const stop=await tx.pjpStop.findUnique({where:{id:record.entityId},include:{orders:true}});
   if(stop.orders.some(o=>!o.deletedAt))throw new AppError('Sudah terdapat order terperinci; gunakan persetujuan order',409);
   await tx.pjpStop.update({where:{id:stop.id},data:{visitSession:{...stop.visitSession,result:{...stop.visitSession.result,manualSalesStatus:body.decision,isManualSalesApproved:body.decision==='APPROVED',manualSalesReviewedBy:actor.id,manualSalesReviewNote:body.note.trim()}}}});
  }else if(['APPROVED','REJECTED'].includes(body.decision))throw new AppError('Pilih akui pengecualian atau perlu koreksi. Keputusan tidak membuat bukti OUT.',400);
  const decision={value:body.decision,note:body.note.trim(),actorId:actor.id,at:new Date().toISOString()};
  const result=await tx.operationalException.update({where:{id},data:{status:body.decision==='REQUIRES_CORRECTION'?'OPEN':body.decision,decision:{...decision,history:[...(record.decision?.history||[]),decision]}}});
  if(body.decision==='REQUIRES_CORRECTION')await createNotification(record.userId,'EXCEPTION_CORRECTION_REQUESTED','Penjelasan presensi diperlukan',body.note.trim(),{exceptionId:id},tx);
  await tx.auditEvent.create({data:{entityType:'OPERATIONAL_EXCEPTION',entityId:id,action:body.decision,actorId:actor.id,actorName:actor.name,before:{status:record.status},after:decision}});
  return result;
 });
}
