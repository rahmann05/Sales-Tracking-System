import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
// Visit plans are executed by Sales. A manager's personal profile cannot change team visit rules.
export async function teamPlanningPolicy(supervisorId){
 const policy=await effectivePolicy({role:'SALES',supervisorId});
 const keys=['PJP_WORKING_DAYS','PJP_MAX_PLAN_DAYS','PJP_MAX_VISITS_PER_DAY','PJP_OVERLOAD_POLICY','PJP_ALLOW_FREQUENCY_OVERRIDE','PJP_ALLOW_OWNER_OVERRIDE','PJP_ALLOWED_INTERVALS','PJP_DEFAULT_INTERVAL','PJP_CALENDAR_SOURCE','PJP_HOLIDAY_POLICY','PJP_PUBLISH_ROLE'];
 return {values:Object.fromEntries(keys.map(key=>[key,policy.values[key]])),versions:policy.versions};
}
