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
 return rows.map(row=>({...row,workflow:map.get(routeWorkflowKey(row.id))||null}));
}
