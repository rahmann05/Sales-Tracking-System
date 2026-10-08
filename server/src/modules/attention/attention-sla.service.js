import { getDynamicConfig } from '../config/config.service.js';
import { SLA_KEYS } from '../../../../shared/attention-sla.mjs';
export async function loadAttentionPolicy(){
  const keys=[...Object.values(SLA_KEYS),'SLA_ESCALATION_DELAY_HOURS'];
  return Object.fromEntries(await Promise.all(keys.map(async key=>[key,await getDynamicConfig(key,0)])));
}
