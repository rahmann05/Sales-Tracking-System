import {AppError} from '../../../utils/errors.js';
import {policyProfiles,invalidatePolicyCache} from './policy-resolver.service.js';
import {policyConflicts} from '../../../../../shared/operational-policy.mjs';
import { CONFIG_DEFAULTS } from '../../../../../shared/config.mjs';
import { validateConfigMap, validateConfigRelations } from './validate-config.service.js';
import { prisma } from '../../../config/prisma.js';
import {freezeOpenWork} from './process-policy.service.js';
import {publicationReadiness} from './approval-readiness.service.js';
import { invalidateConfigCache } from './dynamic-config.service.js';
import {broadcastCacheInvalidation} from '../../../config/socket.js';
import {retainServiceCodes} from '../../../../../shared/reference-catalog.mjs';
const auditValue=(key,value)=>key==='MAPS_API_KEY'?'[REDACTED]':value;
export const saveConfigs=async(configMap,actor={})=>{
  configMap=validateConfigMap(configMap);
  const profiles=await policyProfiles();
  if([...profiles.values()].some(p=>p.versions?.some(v=>Object.keys(configMap).some(k=>Object.hasOwn(v.values,k)))))throw new AppError('Parameter ini sudah memakai versi kebijakan. Ubah melalui draf dan publikasi di pusat pengaturan.',409);
  const result=await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('config:settings'))`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
    const where={key:{in:[...Object.keys(CONFIG_DEFAULTS),'LOGISTICS_METRICS']}};
    const saved=await tx.systemConfig.findMany({where});
    const effective={...CONFIG_DEFAULTS,...Object.fromEntries(saved.map(row=>[row.key,row.value]))};
    validateConfigRelations({...effective,...configMap});
    try{retainServiceCodes(configMap,effective);}catch(e){throw new AppError(e.message,400);}
    const issues=policyConflicts({...effective,...configMap});if(issues.length)throw new AppError(issues.join(' '),400);
    const readiness=await publicationReadiness(tx,{values:configMap,baseOverrides:configMap});if(readiness.length)throw new AppError(readiness.join(' '),400);
    await freezeOpenWork(tx);
    for(const [key,value] of Object.entries(configMap)){
      const changed=JSON.stringify(effective[key])!==JSON.stringify(value);
      await tx.systemConfig.upsert({where:{key},update:{value},create:{key,value}});
      if(changed)await tx.auditEvent.create({data:{actorId:actor.id||null,actorName:actor.name||null,action:'CONFIG_UPDATE',entityType:'SYSTEM_CONFIG',entityId:key,before:{value:auditValue(key,effective[key]??null)},after:{value:auditValue(key,value)}}});
    }
    return Object.fromEntries((await tx.systemConfig.findMany({where,orderBy:{key:'asc'}})).filter(row=>!row.key.startsWith('_')).map(row=>[row.key,row.value]));
  },{timeout:15000});
  invalidateConfigCache();invalidatePolicyCache();broadcastCacheInvalidation('config');return result;
};
