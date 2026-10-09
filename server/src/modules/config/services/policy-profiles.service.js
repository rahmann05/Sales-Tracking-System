import {freezeOpenWork} from './process-policy.service.js';
import {publicationReadiness} from './approval-readiness.service.js';
import {randomUUID} from 'node:crypto';
import {broadcastCacheInvalidation} from '../../../config/socket.js';
import {CONFIG_DEFAULTS,CONFIG_PARAMS} from '../../../../../shared/config.mjs';
import {POLICY_ROLES,POLICY_SECRET_KEYS,policyConflicts} from '../../../../../shared/operational-policy.mjs';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {validateConfigMap,validateConfigRelations} from './validate-config.service.js';
import {profileKey,effectivePolicy,invalidatePolicyCache} from './policy-resolver.service.js';
import {invalidateConfigCache} from './dynamic-config.service.js';
import {policyImpact} from './policy-impact.service.js';
const initial=scope=>({scope,revision:0,draft:{},versions:[]});
const safeValues=values=>Object.fromEntries(Object.entries(values).filter(([key])=>!POLICY_SECRET_KEYS.includes(key)));
async function scopeActor(scope,db=prisma){
 if(typeof scope!=='string')throw new AppError('Profil pengaturan tidak valid',400);
 if(scope==='GLOBAL')return {};
 if(scope.startsWith('ROLE:')&&POLICY_ROLES.includes(scope.slice(5)))return {role:scope.slice(5)};
 if(scope.startsWith('TEAM:')){
  const actor=await db.user.findFirst({where:{id:scope.slice(5),role:'SUPERVISOR',deletedAt:null},select:{id:true,role:true}});
  if(actor)return {role:'SALES',supervisorId:actor.id};
 }
 throw new AppError('Profil harus global, role bawaan, atau tim Supervisor aktif',400);
}
export async function getPolicyProfile(scope='GLOBAL'){
 const actor=await scopeActor(scope),profile=(await prisma.systemConfig.findUnique({where:{key:profileKey(scope)}}))?.value||initial(scope);
 const effective=await effectivePolicy(actor);
 const parent=await effectivePolicy(actor,Date.now(),{excludeScope:scope});
 return {profile,parent,effective:scope==='GLOBAL'?effective:{...effective,values:safeValues(effective.values)},definitions:CONFIG_PARAMS,defaults:CONFIG_DEFAULTS};
}
export async function savePolicyDraft(scope,raw,actor){
 await scopeActor(scope);
 if(!Number.isInteger(raw.revision)||typeof raw.reason!=='string'||raw.reason.trim().length<5||raw.reason.length>2000)throw new AppError('Versi dan alasan perubahan 5–2000 karakter wajib diisi',400);
 const reset=Object.entries(raw.values||{}).filter(([,v])=>v===null).map(([key])=>key);
 if(scope==='GLOBAL'&&reset.length)throw new AppError('Nilai global tidak dapat diwariskan dari profil lain',400);
 const values={...validateConfigMap(Object.fromEntries(Object.entries(raw.values||{}).filter(([,v])=>v!==null))),...Object.fromEntries(reset.map(key=>[key,null]))};
 if(Object.keys(values).some(key=>!CONFIG_PARAMS.some(p=>p.key===key)))throw new AppError('Parameter profil tidak terdaftar',400);
 if(scope!=='GLOBAL'&&Object.keys(values).some(k=>POLICY_SECRET_KEYS.includes(k)||k.startsWith('CODE_')||k==='AUDIT_ACTIVE_RETENTION_DAYS'))throw new AppError('Integrasi rahasia, penomoran dan arsip audit hanya dapat diatur global',400);
 return prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('config:settings'))`;
  const key=profileKey(scope),current=(await tx.systemConfig.findUnique({where:{key}}))?.value||initial(scope);
  if(current.revision!==raw.revision)throw new AppError('Draf sudah berubah. Muat ulang sebelum menyimpan.',409);
  const profile={...current,revision:current.revision+1,draft:values,reason:raw.reason.trim(),updatedBy:actor.id,updatedAt:new Date().toISOString()};
  await tx.systemConfig.upsert({where:{key},create:{key,value:profile},update:{value:profile}});
  await tx.auditEvent.create({data:{entityType:'POLICY_DRAFT',entityId:scope,action:'SAVE_DRAFT',actorId:actor.id,actorName:actor.name,before:{revision:current.revision,values:safeValues(current.draft)},after:{revision:profile.revision,values:safeValues(values),reason:profile.reason}}});
  return profile;
 });
}
export async function previewPolicy(scope,revision){
 const {profile,effective,parent}=await getPolicyProfile(scope);
 if(profile.revision!==revision)throw new AppError('Draf berubah. Muat ulang sebelum meninjau.',409);
 const draft=Object.fromEntries(Object.entries(profile.draft).map(([key,value])=>[key,value===null?parent.values[key]:value]));
 const values={...effective.values,...draft};validateConfigRelations(values);
 const active=(profile.versions||[]).filter(v=>!v.cancelledAt&&+new Date(v.effectiveAt)<=Date.now()).sort((a,b)=>b.revision-a.revision)[0];
 const candidate={...active?.values,...profile.draft};for(const [key,value] of Object.entries(candidate))if(value===null)delete candidate[key];
 const readiness=await publicationReadiness(prisma,{scope,values:profile.draft,override:{scope,profile:{...profile,versions:[{revision:profile.revision,values:candidate,effectiveAt:new Date(0).toISOString()}]}}});
 const conflicts=[...policyConflicts(values),...readiness],impact=await policyImpact(profile.draft,prisma,scope);
 return {...impact,conflicts,changes:Object.entries(draft).filter(([key,value])=>JSON.stringify(value)!==JSON.stringify(effective.values[key])).map(([key,value])=>({key,before:POLICY_SECRET_KEYS.includes(key)?'[RAHASIA]':effective.values[key],after:POLICY_SECRET_KEYS.includes(key)?'[RAHASIA]':value})),revision,scope};
}
export async function publishPolicy(scope,raw,actor){
 const context=await scopeActor(scope);
 const at=raw.effectiveAt?new Date(raw.effectiveAt):new Date();
 if(!Number.isFinite(+at)||+at<Date.now()-60000)throw new AppError('Waktu berlaku harus sekarang atau waktu mendatang',400);
 const result=await prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('config:settings'))`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
  const key=profileKey(scope),profile=(await tx.systemConfig.findUnique({where:{key}}))?.value;
  if(!profile||profile.revision!==raw.revision)throw new AppError('Draf telah berubah. Simpan dan tinjau ulang.',409);
  if(!Object.keys(profile.draft||{}).length)throw new AppError('Tidak ada perubahan dalam draf untuk diterbitkan',400);
  const parent=await effectivePolicy(context,+at,{excludeScope:scope});
  const draft=Object.fromEntries(Object.entries(profile.draft).map(([key,value])=>[key,value===null?parent.values[key]:value]));
  const values={...(await effectivePolicy(context,+at)).values,...draft};validateConfigRelations(values);
  const conflicts=policyConflicts(values);if(conflicts.length)throw new AppError(conflicts.join(' '),400);
  const impact=await policyImpact(profile.draft,tx,scope);
  if(raw.fingerprint!==impact.fingerprint)throw new AppError('Pekerjaan terbuka atau draf berubah. Tinjau dampak kembali.',409);
  const last=[...(profile.versions||[])].filter(v=>!v.cancelledAt).sort((a,b)=>b.revision-a.revision)[0];
  if(last&&+at<+new Date(last.effectiveAt))throw new AppError('Ada versi terjadwal. Waktu versi baru harus setelah versi tersebut.',409);
  const nextValues={...(last?.values||{}),...profile.draft};for(const [key,value] of Object.entries(nextValues))if(value===null)delete nextValues[key];
  const version={id:randomUUID(),revision:profile.revision+1,values:nextValues,reason:profile.reason,actorId:actor.id,actorName:actor.name,effectiveAt:at.toISOString(),publishedAt:new Date().toISOString()};
  const next={...profile,revision:version.revision,draft:{},versions:[...(profile.versions||[]),version]};
  const readiness=await publicationReadiness(tx,{scope,at:+at,values:profile.draft,override:{scope,profile:next}});
  if(readiness.length)throw new AppError(readiness.join(' '),400);
  const users=await tx.user.findMany({where:{deletedAt:null},select:{id:true,role:true,supervisorId:true}});
  for(const user of users){const resolved=await effectivePolicy(user,+at,{override:{scope,profile:next}});const issues=policyConflicts(resolved.values);if(issues.length)throw new AppError(`Konflik pada profil ${user.role}: ${issues.join(' ')}`,400);}
  await freezeOpenWork(tx,scope);
  await tx.systemConfig.update({where:{key},data:{value:next}});
  await tx.auditEvent.create({data:{entityType:'POLICY_VERSION',entityId:version.id,action:'PUBLISH',actorId:actor.id,actorName:actor.name,before:{scope,revision:profile.revision},after:{scope,revision:version.revision,effectiveAt:version.effectiveAt,values:safeValues(version.values),impact:impact.counts,reason:version.reason}}});
  return next;
 },{timeout:60000});
 invalidatePolicyCache();invalidateConfigCache();broadcastCacheInvalidation('policies');return result;
}
export async function restorePolicy(scope,raw,actor){
 const {profile}=await getPolicyProfile(scope),version=profile.versions.find(v=>v.id===raw.versionId);
 if(!version)throw new AppError('Versi tidak ditemukan',404);
 const latest=[...profile.versions].filter(v=>!v.cancelledAt).sort((a,b)=>b.revision-a.revision)[0];
 const removed=Object.keys(latest?.values||{}).filter(key=>!Object.hasOwn(version.values,key));
 const {parent}=await getPolicyProfile(scope);
 const resets=Object.fromEntries(removed.map(key=>[key,scope==='GLOBAL'?parent.values[key]:null]));
 return savePolicyDraft(scope,{revision:raw.revision,values:{...resets,...version.values},reason:raw.reason},actor);
}
export async function cancelScheduledPolicy(scope,raw,actor){
 await scopeActor(scope);
 if(typeof raw.reason!=='string'||raw.reason.trim().length<5||raw.reason.length>2000)throw new AppError('Alasan pembatalan 5–2000 karakter wajib diisi',400);
 const result=await prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('config:settings'))`;
  const key=profileKey(scope),profile=(await tx.systemConfig.findUnique({where:{key}}))?.value;
  if(!profile||profile.revision!==raw.revision)throw new AppError('Profil berubah. Muat ulang sebelum membatalkan jadwal.',409);
  const future=profile.versions.filter(v=>!v.cancelledAt&&+new Date(v.effectiveAt)>Date.now()).sort((a,b)=>b.revision-a.revision);
  const version=future.find(v=>v.id===raw.versionId);
  if(!version)throw new AppError('Hanya versi yang belum berlaku dapat dibatalkan',409);
  if(future[0].id!==version.id)throw new AppError('Batalkan versi terjadwal paling akhir terlebih dahulu agar versi turunannya tidak kehilangan dasar.',409);
  const cancelledAt=new Date().toISOString();
  const next={...profile,revision:profile.revision+1,versions:profile.versions.map(v=>v.id===version.id?{...v,cancelledAt,cancelledBy:actor.id,cancelReason:raw.reason.trim()}:v)};
  await tx.systemConfig.update({where:{key},data:{value:next}});
  await tx.auditEvent.create({data:{entityType:'POLICY_VERSION',entityId:version.id,action:'CANCEL_SCHEDULE',actorId:actor.id,actorName:actor.name,before:{scope,effectiveAt:version.effectiveAt},after:{scope,cancelledAt,reason:raw.reason.trim()}}});
  return next;
 });
 invalidatePolicyCache();invalidateConfigCache();broadcastCacheInvalidation('policies');return result;
}
