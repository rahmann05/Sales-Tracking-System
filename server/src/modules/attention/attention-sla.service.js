import {CONFIG_DEFAULTS} from '../../../../shared/config.mjs';
import { getDynamicConfig } from '../config/config.service.js';
import {SLA_CALENDAR_KEYS} from '../../../../shared/business-clock.mjs';
import { SLA_KEYS } from '../../../../shared/attention-sla.mjs';
export async function loadAttentionPolicy(){
  const keys=[...Object.values(SLA_KEYS),'OUTLET_LOCATION_ALERTS_ENABLED','SLA_ESCALATION_DELAY_HOURS',...SLA_CALENDAR_KEYS];
  return Object.fromEntries(await Promise.all(keys.map(async key=>[key,await getDynamicConfig(key,CONFIG_DEFAULTS[key]??0)])));
}
