import {OUTLET_COMPARISON_DEFAULTS,OUTLET_COMPARISON_KEYS} from '../../../../../shared/outlet-evidence-policy.mjs';
import {getDynamicConfig} from '../../config/config.service.js';
export async function outletComparisonPolicy(){
 const policy=Object.fromEntries(await Promise.all(Object.entries(OUTLET_COMPARISON_KEYS).map(async([name,key])=>[name,await getDynamicConfig(key,OUTLET_COMPARISON_DEFAULTS[name])])));
 return {...policy,suspectDistance:await getDynamicConfig('VALIDATION_DISTANCE_SUSPECT',500),warningDistance:await getDynamicConfig('VALIDATION_DISTANCE_WARNING',200)};
}
