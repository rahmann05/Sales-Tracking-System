import {ASSIGNMENT_KINDS} from './assignment-schedules.mjs';
export const AUTO_DELEGATION_KINDS=Object.fromEntries(Object.entries(ASSIGNMENT_KINDS).filter(([key])=>key!=='TEAM'));
export const AUTO_DELEGATION_TRIGGERS={OVERDUE:'Tenggat terlewat',UNASSIGNED:'Belum mempunyai PIC',OWNER_UNAVAILABLE:'PIC tidak lagi memenuhi syarat'};
export function delegationTrigger(rule,state,ownerAvailable,now=Date.now()){
 if(state.finished)return false;
 if(rule.trigger==='UNASSIGNED')return !state.ownerId;
 if(rule.trigger==='OWNER_UNAVAILABLE')return Boolean(state.ownerId&&!ownerAvailable);
 const due=state.dueAt&&Date.parse(state.dueAt.length===10?state.dueAt+'T23:59:59.999+07:00':state.dueAt);
 return Number.isFinite(due)&&now>=due+rule.graceMinutes*60000;
}
export function delegationDeadline(kind,hours,now=Date.now()){
 const at=new Date(now+hours*3600000);
 return kind==='FOLLOW_UP'?new Date(+at+7*3600000).toISOString().slice(0,10):at.toISOString();
}
export const delegationStage=state=>String(state.context?.stage??'DEFAULT');
export function delegationBlock(rule,state,record,now=Date.now()){
 if(!record)return null;
 if(record.transfers>=rule.maxTransfers)return 'Batas perpindahan otomatis telah tercapai.';
 if(record.lastFingerprint&&record.lastFingerprint!==state.fingerprint)return 'Penugasan atau tahap telah diubah di luar aturan ini. Periksa dan izinkan ulang secara eksplisit.';
 if(record.lastAppliedAt&&now<Date.parse(record.lastAppliedAt)+rule.cooldownMinutes*60000)return 'Masa jeda perpindahan belum selesai.';
 return null;
}
