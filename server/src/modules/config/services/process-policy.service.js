import {CONFIG_DEFAULTS} from '../../../../../shared/config.mjs';
import {DRIVER_EVIDENCE_KEYS} from '../../../../../shared/operational-policy.mjs';
import {currentPolicy,withPolicy} from './policy-context.service.js';
import {getDynamicConfig} from './dynamic-config.service.js';
import {effectivePolicy} from './policy-resolver.service.js';
import {isProcessPolicyKey,processPolicyValues} from '../../../../../shared/process-policy.mjs';
export function policySnapshot(policy=currentPolicy()){
 const p=policy||{values:CONFIG_DEFAULTS,versions:[],at:new Date().toISOString()};
 return {values:Object.fromEntries(Object.entries(p.values).filter(([key])=>isProcessPolicyKey(key))),versions:p.versions,at:p.at};
}
export const capturePolicySnapshot=async()=>policySnapshot(currentPolicy()||await effectivePolicy());
export const processValue=(entity,key,fallback)=>entity?.policySnapshot?.values&&isProcessPolicyKey(key)?entity.policySnapshot.values[key]??CONFIG_DEFAULTS[key]??fallback:getDynamicConfig(key,fallback);
export function withProcessPolicy(entity,fn){
 const live=currentPolicy();return entity?.policySnapshot?withPolicy({...live,values:processPolicyValues(entity.policySnapshot,live?.values)},fn):fn();
}
// Freeze pre-existing open work before its first configuration change. Never backfill evidence.
export async function freezeOpenWork(db,scope='GLOBAL'){
 const actors=new Map();
 const actorFor=async id=>{if(!actors.has(id))actors.set(id,await db.user.findUnique({where:{id},select:{id:true,role:true,supervisorId:true}})||{});return actors.get(id);};
 const matches=actor=>scope==='GLOBAL'||scope===`ROLE:${actor.role}`||scope===`TEAM:${actor.supervisorId}`||(actor.role==='SUPERVISOR'&&scope===`TEAM:${actor.id}`);
 const snapshotFor=async id=>policySnapshot(await effectivePolicy(await actorFor(id)));
 const tables=[['pjpStop',{status:'PENDING',OR:[{attendances:{some:{type:'IN'}}},{visitSession:{path:['state'],equals:'ACTIVE'}}]},row=>row.pjp.userId,{pjp:true}],['order',{deletedAt:null,status:'PENDING_APPROVAL'},row=>row.createdBy],['customerRegistration',{registrationStatus:{in:['SUBMITTED','SPV_APPROVED']}},row=>row.salesmanId],['deliveryRoute',{closedAt:null,cancelledAt:null},row=>row.createdById],['packingList',{status:'DRAFT'},row=>row.createdById],['staffActivity',{checkOutAt:null},row=>row.userId]];
 for(const [name,where,owner,include] of tables){
  const rows=await db[name].findMany({where,...(include?{include}:{})});
  for(const row of rows)if(!row.policySnapshot&&row.checklist?.state!=='FINISHED'){
   const id=owner(row),actor=id?await actorFor(id):{};
   const driver=name==='deliveryRoute'?await actorFor(row.driverId):null;
   if(!matches(actor)&&!(driver&&matches(driver)))continue;
   const snapshot=await snapshotFor(id);
   if(driver){const driverPolicy=await effectivePolicy(driver);for(const key of DRIVER_EVIDENCE_KEYS)snapshot.values[key]=driverPolicy.values[key];snapshot.driver={id:row.driverId,versions:driverPolicy.versions,at:driverPolicy.at};}
   await db[name].update({where:{id:row.id},data:{policySnapshot:{...snapshot,provenance:'LEGACY_OPEN_WORK'}}});
  }
 }
}
