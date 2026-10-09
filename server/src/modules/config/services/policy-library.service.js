import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {POLICY_SECRET_KEYS,policyConflicts,policyGlobalOnly} from '../../../../../shared/operational-policy.mjs';
import {CONFIG_DEFAULTS} from '../../../../../shared/config.mjs';
import {validateConfigMap,validateConfigRelations} from './validate-config.service.js';
import {savePolicyDraft} from './policy-profiles.service.js';
const prefix='_POLICY_LIBRARY:';
const schema=z.object({id:z.string().uuid().optional(),revision:z.number().int().nonnegative(),name:z.string().trim().min(3).max(100),description:z.string().trim().max(1000).default(''),reason:z.string().trim().min(5).max(2000),values:z.record(z.unknown())}).strict();
export async function listPolicyLibrary(){
 return (await prisma.systemConfig.findMany({where:{key:{startsWith:prefix}},orderBy:{key:'asc'}})).map(row=>row.value).sort((a,b)=>a.name.localeCompare(b.name));
}
export async function savePolicyLibrary(raw,actor){
 const input=schema.parse(raw),values=validateConfigMap(input.values);
 if(Object.keys(values).some(key=>POLICY_SECRET_KEYS.includes(key)))throw new AppError('Profil salinan tidak boleh menyimpan rahasia integrasi atau sesi',400);
 validateConfigRelations({...CONFIG_DEFAULTS,...values});
 const issues=policyConflicts({...CONFIG_DEFAULTS,...values});if(issues.length)throw new AppError(issues.join(' '),400);
 return prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('config:settings'))`;
  const id=input.id||randomUUID(),key=prefix+id,current=(await tx.systemConfig.findUnique({where:{key}}))?.value;
  if(input.id&&!current)throw new AppError('Profil salinan tidak ditemukan',404);
  if((current?.revision||0)!==input.revision)throw new AppError('Profil berubah; muat ulang sebelum menyimpan',409);
  const next={id,revision:input.revision+1,name:input.name,description:input.description,values,reason:input.reason,updatedAt:new Date().toISOString(),updatedBy:actor.id};
  await tx.systemConfig.upsert({where:{key},create:{key,value:next},update:{value:next}});
  await tx.auditEvent.create({data:{entityType:'POLICY_LIBRARY',entityId:id,action:current?'UPDATE':'CREATE',actorId:actor.id,actorName:actor.name,before:current||{},after:next}});
  return next;
 });
}
export async function copyPolicyLibrary(raw,actor){
 const input=z.object({id:z.string().uuid(),templateRevision:z.number().int().positive(),scope:z.string(),revision:z.number().int().nonnegative(),reason:z.string().trim().min(5).max(2000)}).strict().parse(raw);
 const row=await prisma.systemConfig.findUnique({where:{key:prefix+input.id}});
 if(!row)throw new AppError('Profil salinan tidak ditemukan',404);
 if(row.value.revision!==input.templateRevision)throw new AppError('Profil salinan berubah; muat ulang sebelum menyalin',409);
 const values=Object.fromEntries(Object.entries(row.value.values).filter(([key])=>input.scope==='GLOBAL'||!policyGlobalOnly(key)));
 return savePolicyDraft(input.scope,{revision:input.revision,values,reason:input.reason},actor);
}
