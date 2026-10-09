import test from 'node:test';
import assert from 'node:assert/strict';
import {addSlaHours} from '../../shared/business-clock.mjs';
import {applyAttentionSla,escalationReady} from '../../shared/attention-sla.mjs';
const policy={SLA_CLOCK_MODE:'BUSINESS',SLA_WORKING_DAYS:'1,2,3,4,5',SLA_WORK_START:'08:00',SLA_WORK_END:'17:00'};
test('business SLA crosses weekends and explicit holidays in WIB',()=>{
 const friday='2026-10-09T16:00:00+07:00';
 assert.equal(addSlaHours(friday,2,policy).toISOString(),'2026-10-12T02:00:00.000Z');
 assert.equal(addSlaHours(friday,2,{...policy,SLA_HOLIDAYS:'2026-10-12'}).toISOString(),'2026-10-13T02:00:00.000Z');
 assert.equal(addSlaHours('2026-10-10T01:00:00+07:00',1,policy).toISOString(),'2026-10-12T02:00:00.000Z');
 assert.equal(addSlaHours(friday,2,{}).toISOString(),'2026-10-09T11:00:00.000Z');
});
test('explicit deadline remains unchanged, escalation uses the selected work clock',()=>{
 const row={stage:'ORDER_APPROVAL',since:'2026-10-09T16:00:00+07:00'};
 const settings={...policy,SLA_ORDER_APPROVAL_HOURS:2};
 assert.equal(applyAttentionSla(row,settings).dueAt,'2026-10-12T02:00:00.000Z');
 const explicit={...row,dueAt:'2026-10-09T10:00:00.000Z'};
 assert.equal(applyAttentionSla(explicit,settings).dueAt,explicit.dueAt);
 assert.equal(escalationReady(explicit,2,Date.parse('2026-10-11T10:00:00Z'),policy),false);
 assert.equal(escalationReady(explicit,2,Date.parse('2026-10-12T03:00:01Z'),policy),true);
});
