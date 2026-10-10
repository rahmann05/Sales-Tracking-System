import {CONFIG_DEFAULTS} from './config.mjs';
import {POLICY_SECRET_KEYS} from './operational-policy.mjs';
export const isProcessPolicyKey=key=>!POLICY_SECRET_KEYS.includes(key)&&!key.startsWith('FEATURE_')&&!key.includes('TRACKING_');
// A field added after an instance started uses its compatibility default, not a new team override.
export function processPolicyValues(snapshot,live={}){
 if(!snapshot?.values)return live;
 const defaults=Object.fromEntries(Object.entries(CONFIG_DEFAULTS).filter(([key])=>isProcessPolicyKey(key)));
 return {...live,...defaults,...Object.fromEntries(Object.entries(snapshot.values).filter(([key])=>isProcessPolicyKey(key)))};
}
