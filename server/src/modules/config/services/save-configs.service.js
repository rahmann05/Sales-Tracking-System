import { CONFIG_DEFAULTS } from '../../../../../shared/config.mjs';
import { validateConfigMap, validateConfigRelations } from './validate-config.service.js';
import { prisma } from '../../../config/prisma.js';
import { invalidateConfigCache } from './dynamic-config.service.js';
const auditValue=(key,value)=>key==='MAPS_API_KEY'?'[REDACTED]':value;
export const saveConfigs=async(configMap,actor={})=>{
  configMap=validateConfigMap(configMap);
  const result=await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('config:settings'))`;
    const where={key:{in:[...Object.keys(CONFIG_DEFAULTS),'LOGISTICS_METRICS']}};
    const saved=await tx.systemConfig.findMany({where});
    const effective={...CONFIG_DEFAULTS,...Object.fromEntries(saved.map(row=>[row.key,row.value]))};
    validateConfigRelations({...effective,...configMap});
    for(const [key,value] of Object.entries(configMap)){
      const changed=JSON.stringify(effective[key])!==JSON.stringify(value);
      await tx.systemConfig.upsert({where:{key},update:{value},create:{key,value}});
      if(changed)await tx.auditEvent.create({data:{actorId:actor.id||null,actorName:actor.name||null,action:'CONFIG_UPDATE',entityType:'SYSTEM_CONFIG',entityId:key,before:{value:auditValue(key,effective[key]??null)},after:{value:auditValue(key,value)}}});
    }
    return Object.fromEntries((await tx.systemConfig.findMany({where,orderBy:{key:'asc'}})).filter(row=>!row.key.startsWith('_')).map(row=>[row.key,row.value]));
  },{timeout:15000});
  invalidateConfigCache();return result;
};
