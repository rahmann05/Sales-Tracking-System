import {capturePolicySnapshot} from '../../config/services/process-policy.service.js';
import {getDynamicConfig} from '../../config/config.service.js';
export const routeWorkflowKey=id=>'_ROUTE_CHANGE_WORKFLOW:'+id;
export async function newRouteWorkflow(){
 const snapshot=await capturePolicySnapshot();
 const mode=await getDynamicConfig('CLOSED_OUTLET_DECISION_MODE','INHERIT'),legacyRequireAdmin=await getDynamicConfig('REROUTE_REQUIRE_ADMIN_APPROVAL',false);
 return {mode:mode==='INHERIT'?(legacyRequireAdmin?'LEGACY_SEQUENTIAL':'SUPERVISOR_OR_ADMIN'):mode,legacyRequireAdmin,policySnapshot:snapshot,proposal:null};
}
export async function attachRouteWorkflows(db,rows){
 if(!rows.length)return rows;
 const configs=await db.systemConfig.findMany({where:{key:{in:rows.map(r=>routeWorkflowKey(r.id))}}});
 const map=new Map(configs.map(c=>[c.key,c.value]));
 const ids=configs.map(c=>c.value?.revisit?.stopId).filter(Boolean);
 const stops=ids.length?await db.pjpStop.findMany({where:{id:{in:ids}},include:{attendances:true}}):[];
 const lookup=new Map(stops.map(s=>[s.id,s]));
 return rows.map(row=>{const workflow=map.get(routeWorkflowKey(row.id))||null,revisit=workflow?.revisit,stop=revisit&&lookup.get(revisit.stopId);
  const state=!revisit?null:!stop?'UNAVAILABLE':stop.visitSession?.state==='INCOMPLETE'?'INCOMPLETE':stop.visitSession?.state==='FINISHED'||stop.attendances.some(a=>a.type==='OUT')?'COMPLETED':stop.status==='SKIPPED'?'SKIPPED':Date.parse(revisit.effectiveAt)<Date.now()?'OVERDUE':'SCHEDULED';
  return {...row,decisionAction:workflow?.decisionAction||workflow?.proposal?.action||row.type,workflow,revisit:revisit?{...revisit,state}:null};
 });
}
