import {automaticFollowUp} from '../../../../shared/automatic-follow-up.mjs';
import {processValue} from '../config/services/process-policy.service.js';
import {followUpActor,assertFollowUpOwner} from './follow-up-access.service.js';
import {assertSalesAccess} from '../../utils/team-scope.js';
import {getDynamicConfig} from '../config/config.service.js';
import {AppError} from '../../utils/errors.js';
export async function prepareAutomaticFollowUp(db,user,record,items,answers,ownerOverride=null){
 const keys=['FOLLOW_UP_AUTO_ENABLED','FOLLOW_UP_AUTO_TRIGGER','FOLLOW_UP_AUTO_SLA_MINUTES','FOLLOW_UP_AUTO_DUE_DAYS','FOLLOW_UP_AUTO_OWNER'];
 const values=Object.fromEntries(await Promise.all(keys.map(async key=>[key,await processValue(record,key)])));
 const plan=automaticFollowUp(record,items,answers,values);
 if(!plan)return null;
 if(await getDynamicConfig('FEATURE_FOLLOW_UP_MODE','ACTIVE')!=='ACTIVE')throw new AppError('Pembuatan tugas baru sedang dijeda. Audit/kunjungan tetap tersimpan; ulangi penugasan setelah fitur aktif.',409);
 await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
 const {actor,people}=await followUpActor(db,user,'assign');
 await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`follow-up:${record.id}`}))`;
 if((await db.staffActivity.findUnique({where:{id:record.id}}))?.followUp)return null;
 const stop=await db.pjpStop.findUnique({where:{id:record.activityKey},include:{pjp:true,outlet:{include:{cluster:true}}}});
 const ownerId=ownerOverride||(values.FOLLOW_UP_AUTO_OWNER==='CLUSTER_SALES'?stop?.outlet?.cluster?.assignedSalesId:stop?.pjp?.userId);
 const owner=people.find(p=>p.id===ownerId);
 if(!owner)throw new AppError('Tugas otomatis belum dapat dibuat: Sales PIC tidak tersedia. Lengkapi penugasan wilayah atau pilih tugas manual.',409);
 await assertSalesAccess(actor,owner.id,db);
 const reviewerMode=await processValue(record,'FOLLOW_UP_REVIEWER_MODE','BOTH');
 assertFollowUpOwner(owner,actor,people,await processValue(record,'FOLLOW_UP_REQUIRE_REVIEW',true),reviewerMode);
 return {...plan,ownerId:owner.id,ownerName:owner.name,reviewerMode,status:'OPEN',revision:1,createdBy:actor.id,createdAt:plan.source.at,history:[{action:'AUTO_ASSIGNED',actorId:actor.id,at:plan.source.at,source:plan.source}]};
}
