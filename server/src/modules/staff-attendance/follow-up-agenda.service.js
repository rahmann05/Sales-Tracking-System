import {z} from 'zod';
import {prisma} from '../../config/prisma.js';
import {AppError} from '../../utils/errors.js';
import {followUpActor,assertFollowUpOwner} from './follow-up-access.service.js';
import {followUpScope} from './follow-up.service.js';
import {processValue} from '../config/services/process-policy.service.js';
import {effectivePolicy} from '../config/services/policy-resolver.service.js';
import {withPolicy} from '../config/services/policy-context.service.js';
import {ensureSalesPjpForDate,lockSalesPjpForDate} from '../pjp/services/pjp.helpers.js';
import {wibDateKey} from '../../../../shared/visit-metrics.mjs';
import {notifyFollowUp} from './follow-up-notification.service.js';
import {broadcastCacheInvalidation} from '../../config/socket.js';

// Communication and data corrections remain tasks. Only an explicitly scheduled
// physical visit is added to PJP; scheduling never manufactures attendance.
export async function scheduleFollowUpVisit(id,raw,user){
 const data=z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),revision:z.number().int().nonnegative(),pjpCode:z.string().trim().max(100).optional()}).parse(raw);
 const date=new Date(`${data.date}T12:00:00+07:00`);
 if(!Number.isFinite(+date)||wibDateKey(date)!==data.date||data.date<wibDateKey())throw new AppError('Pilih tanggal kunjungan yang valid mulai hari ini.',400);
 const updated=await prisma.$transaction(async db=>{
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`follow-up:${id}`}))`;
  const {actor,people}=await followUpActor(db,user,'assign');
  const record=await db.staffActivity.findFirst({where:{AND:[{id},await followUpScope(actor,db)]}}),f=record?.followUp;
  if(!f||f.status!=='OPEN')throw new AppError('Hanya arahan terbuka yang dapat dijadwalkan.',409);
  if(f.scheduledVisit){if(f.scheduledVisit.date===data.date&&f.scheduledVisit.ownerId===f.ownerId)return record;throw new AppError('Arahan sudah dijadwalkan. Selesaikan atau alihkan penugasan sebelum membuat jadwal baru.',409);}
  if((f.revision||0)!==data.revision)throw new AppError('Arahan berubah. Muat ulang sebelum menjadwalkan.',409);
  const owner=people.find(person=>person.id===f.ownerId);
  assertFollowUpOwner(owner,actor,people,await processValue(record,'FOLLOW_UP_REQUIRE_REVIEW',true),f.reviewerMode||'BOTH');
  const source=await db.pjpStop.findUnique({where:{id:record.activityKey},include:{outlet:{include:{cluster:true}}}});
  if(!source?.outlet||source.outlet.deletedAt||source.outlet.cluster?.deletedAt||source.outlet.cluster?.supervisorId!==owner.supervisorId)throw new AppError('Toko sumber tidak tersedia dalam wilayah Sales penerima. Periksa master/penugasan terlebih dahulu.',409);
  const policy=await effectivePolicy(owner,Date.now(),{fresh:true});
  if(policy.values.FEATURE_PJP_MODE!=='ACTIVE')throw new AppError('Pembuatan agenda sedang dijeda. Arahan tetap dapat ditangani tanpa membuat kunjungan.',409);
  await lockSalesPjpForDate(db,owner.id,data.date);
  const pjp=await withPolicy(policy,()=>ensureSalesPjpForDate(db,owner.id,date,data.pjpCode));
  if(!pjp)throw new AppError('PJP belum dapat dibuat pada tanggal ini. Pilih hari kerja yang tersedia atau siapkan PJP/kode manual terlebih dahulu.',422);
  let stop=await db.pjpStop.findFirst({where:{pjpId:pjp.id,outletId:source.outletId,validationOnly:false,status:'PENDING'}}),added=false;
  if(!stop){const last=await db.pjpStop.aggregate({where:{pjpId:pjp.id},_max:{sequence:true}});stop=await db.pjpStop.create({data:{pjpId:pjp.id,outletId:source.outletId,sequence:(last._max.sequence||0)+1,status:'PENDING'}});added=true;}
  if(pjp.status==='COMPLETED')await db.pjp.update({where:{id:pjp.id},data:{status:'IN_PROGRESS'}});
  const at=new Date().toISOString(),scheduledVisit={stopId:stop.id,pjpId:pjp.id,date:data.date,ownerId:owner.id,added,at};
  const followUp={...f,scheduledVisit,revision:(f.revision||0)+1,history:[...(f.history||[]),{action:'VISIT_SCHEDULED',actorId:actor.id,actorName:actor.name,at,scheduledVisit}]};
  const result=await db.staffActivity.update({where:{id},data:{followUp}});
  await db.auditEvent.create({data:{entityType:'FOLLOW_UP',entityId:id,action:'VISIT_SCHEDULED',actorId:actor.id,actorName:actor.name,before:{scheduledVisit:f.scheduledVisit||null},after:{scheduledVisit}}});
  await notifyFollowUp(db,result,'ASSIGNED',actor.id);return result;
 },{timeout:30000});
 broadcastCacheInvalidation('pjp');return updated;
}

export async function attachAgendaInstructions(pjp,db=prisma){
 if(!pjp?.stops?.length)return pjp;
 const records=await db.staffActivity.findMany({where:{AND:[{followUp:{path:['ownerId'],equals:pjp.userId}},{followUp:{path:['scheduledVisit','pjpId'],equals:pjp.id}}]},select:{id:true,followUp:true,policySnapshot:true}});
 return {...pjp,stops:pjp.stops.map(stop=>({...stop,workInstructions:records.filter(record=>record.followUp.scheduledVisit.stopId===stop.id).map(record=>({id:record.id,followUp:record.followUp,policySnapshot:record.policySnapshot}))}))};
}
