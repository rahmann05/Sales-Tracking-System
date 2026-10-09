import {CONFIG_PARAMS} from '../../../../../shared/config.mjs';
import {POLICY_SECRET_KEYS} from '../../../../../shared/operational-policy.mjs';
import {prisma} from '../../../config/prisma.js';
import {getDynamicConfig,configGeneration} from './dynamic-config.service.js';
let cache=null,lastFetch=0,lastGeneration=-1,pending=null,epoch=0;
export const invalidatePolicyCache=()=>{cache=null;lastFetch=0;pending=null;epoch++;};
export const profileKey=scope=>`_POLICY_PROFILE:${scope}`;
export const publicPolicy=policy=>({...policy,values:Object.fromEntries(Object.entries(policy.values).filter(([key])=>!POLICY_SECRET_KEYS.includes(key)))});
export async function policyProfiles({fresh=false}={}){
 const generation=configGeneration(),revision=epoch;
 if(fresh||!cache||lastGeneration!==generation||Date.now()-lastFetch>5000){
  if(!pending||pending.generation!==generation){
   const flight=prisma.systemConfig.findMany({where:{key:{startsWith:'_POLICY_PROFILE:'}}}).then(rows=>{
    const result=new Map(rows.filter(row=>row.key.startsWith('_POLICY_PROFILE:')).map(row=>[row.key.slice('_POLICY_PROFILE:'.length),row.value]));
    if(generation===configGeneration()&&revision===epoch){cache=result;lastFetch=Date.now();lastGeneration=generation;}
    return result;
   });
   const holder={generation,flight};pending=holder;flight.finally(()=>{if(pending===holder)pending=null;}).catch(()=>{});
  }
  const result=await pending.flight;
  return generation===configGeneration()&&revision===epoch?result:policyProfiles({fresh});
 }
 return cache;
}
export async function effectivePolicy(actor={},now=Date.now(),options={}){
 const values=Object.fromEntries(await Promise.all(CONFIG_PARAMS.map(async p=>[p.key,await getDynamicConfig(p.key,p.defaultValue,{base:true})])));
 Object.assign(values,options.baseOverrides||{});
 const profiles=await policyProfiles({fresh:options.fresh}),sources={},versions=[];
 const scopes=['GLOBAL',...(actor.role?[`ROLE:${actor.role}`]:[]),...(actor.supervisorId?[`TEAM:${actor.supervisorId}`]:actor.role==='SUPERVISOR'?[`TEAM:${actor.id}`]:[])];
 for(const scope of scopes){
  if(scope===options.excludeScope)continue;
  const profile=options.override?.scope===scope?options.override.profile:profiles.get(scope);
  const version=(profile?.versions||[]).filter(v=>!v.cancelledAt&&+new Date(v.effectiveAt)<=now).sort((a,b)=>+new Date(b.effectiveAt)-+new Date(a.effectiveAt)||b.revision-a.revision)[0];
  if(version){Object.assign(values,version.values);for(const key of Object.keys(version.values))sources[key]=scope;versions.push({scope,revision:version.revision,effectiveAt:version.effectiveAt});}
 }
 return {values,sources,versions,actor,at:new Date(now).toISOString()};
}
