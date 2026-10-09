import {addSlaHours} from './business-clock.mjs';
export const SLA_KEYS={ORDER_APPROVAL:'SLA_ORDER_APPROVAL_HOURS',PACKING_DRAFT:'SLA_PACKING_DRAFT_HOURS',PACKING_ALLOCATION:'SLA_PACKING_ALLOCATION_HOURS',TRIP_CLOSE:'SLA_TRIP_CLOSE_HOURS',EXCEPTION:'SLA_VISIT_VALIDATION_HOURS',FOLLOW_UP_REVIEW:'SLA_FOLLOW_UP_REVIEW_HOURS'};
export function applyAttentionSla(row,policy={}){
  const hours=Number(policy[SLA_KEYS[row.stage]]),anchor=Date.parse(row.since);
  const explicit=row.status==='SUBMITTED'?row.reviewDueAt:row.dueAt||row.dueDate;
  if(explicit)return {...row,deadlineSource:'EXPLICIT'};
  if(!Number.isInteger(hours)||hours<=0||!Number.isFinite(anchor))return row;
  const dueAt=addSlaHours(anchor,hours,policy).toISOString();
  return {...row,...(row.status==='SUBMITTED'?{reviewDueAt:dueAt}:{dueAt}),deadlineSource:'SLA_POLICY',slaHours:hours,slaClock:policy.SLA_CLOCK_MODE||'CALENDAR'};
}
export function attentionDeadline(row){
  if(row.status==='SUBMITTED')return row.reviewDueAt?Date.parse(row.reviewDueAt):Infinity;
  return row.dueAt?Date.parse(row.dueAt):row.dueDate?Date.parse(`${row.dueDate}T23:59:59.999+07:00`):Infinity;
}
export function escalationReady(row,delayHours,now=Date.now(),policy={}){
  return Number.isInteger(delayHours)&&delayHours>0&&Number.isFinite(attentionDeadline(row))&&now>+addSlaHours(attentionDeadline(row),delayHours,policy);
}
