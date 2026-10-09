import {orderReviewRole} from './approval-workflow.mjs';
export function reviewerPool(people,applicant,permission,{allowSelf=false}={}){
 return people.filter(p=>!p.deletedAt&&p.permissions?.[permission]!==false&&(allowSelf||p.id!==applicant?.id)&&(p.role==='ADMIN'||p.role==='SUPERVISOR'&&(!applicant?.deletedAt&&p.id===applicant?.supervisorId||allowSelf&&p.id===applicant?.id)));
}
const missing=(mode,pool)=>mode==='NONE'?[]:mode==='BOTH'?(pool.length?[]:['Admin atau SPV tim']):mode==='SEQUENTIAL'?['ADMIN','SUPERVISOR'].filter(role=>!pool.some(p=>p.role===role)):[mode].filter(role=>!pool.some(p=>p.role===role));
export function orderReviewerGaps(order,applicant,people,{allStages=false}={}){
 const mode=order.policySnapshot?.values?.ORDER_APPROVAL_MODE||'BOTH',required=allStages?mode:orderReviewRole(order);
 return missing(required,reviewerPool(people,applicant,'can_approve_order'));
}
export function registrationReviewerGaps(record,applicant,people){
 const values=record.policySnapshot?.values||{},mode=values.REGISTRATION_APPROVAL_MODE||'BOTH',activator=mode==='SEQUENTIAL'?'ADMIN':values.REGISTRATION_ACTIVATOR||'BOTH';
 const pool=reviewerPool(people,applicant,'can_approve_outlet',{allowSelf:true});
 const reviewed=record.registrationStatus==='SPV_APPROVED';
 return [...new Set([...(reviewed?[]:missing(mode,pool)),...missing(activator,pool)])];
}
