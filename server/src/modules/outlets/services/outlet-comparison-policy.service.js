import {OUTLET_COMPARISON_DEFAULTS,OUTLET_COMPARISON_KEYS} from '../../../../../shared/outlet-evidence-policy.mjs';
import {getDynamicConfig} from '../../config/config.service.js';
export async function outletComparisonPolicy(){
 const policy=Object.fromEntries(await Promise.all(Object.entries(OUTLET_COMPARISON_KEYS).map(async([name,key])=>[name,await getDynamicConfig(key,OUTLET_COMPARISON_DEFAULTS[name])])));
 const providerLimits=Object.fromEntries(await Promise.all(['OUTLET_REVIEW_DAILY_CALL_LIMIT','OUTLET_REVIEW_CALLS_PER_MINUTE','OUTLET_REVIEW_DAILY_BUDGET_RUPIAH','OUTLET_REVIEW_ESTIMATED_CALL_RUPIAH'].map(async key=>[key,await getDynamicConfig(key,0)])));
 return {...policy,providerLimits,suspectDistance:await getDynamicConfig('VALIDATION_DISTANCE_SUSPECT',500),warningDistance:await getDynamicConfig('VALIDATION_DISTANCE_WARNING',200)};
}
