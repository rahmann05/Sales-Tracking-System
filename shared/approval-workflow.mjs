export function orderApprovalDecision({totalValue=0,hasPriceOverride=false}={},values={}){
 const baseMode=values.ORDER_APPROVAL_MODE||'BOTH',threshold=Number(values.ORDER_APPROVAL_AMOUNT_THRESHOLD)||0;
 const amount=threshold>0&&Number.isFinite(totalValue)&&totalValue>=threshold;
 const price=hasPriceOverride&&values.ORDER_PRICE_OVERRIDE_APPROVAL_MODE&&values.ORDER_PRICE_OVERRIDE_APPROVAL_MODE!=='INHERIT';
 const priority=values.ORDER_APPROVAL_CONDITION_PRIORITY||'PRICE_FIRST';
 const source=price&&(!amount||priority==='PRICE_FIRST')?'PRICE_OVERRIDE':amount?'AMOUNT':'BASE';
 const mode=source==='PRICE_OVERRIDE'?values.ORDER_PRICE_OVERRIDE_APPROVAL_MODE:source==='AMOUNT'?values.ORDER_APPROVAL_AMOUNT_MODE||'ADMIN':baseMode;
 return {mode,baseMode,source,priority,threshold,totalValue,hasPriceOverride,matched:{amount,priceOverride:Boolean(price)}};
}
export function orderReviewRole(order={},values={}){
 const mode=order.policySnapshot?.values?.ORDER_APPROVAL_MODE||values.ORDER_APPROVAL_MODE||'BOTH';
 if(mode==='SEQUENTIAL')return (order.history||[]).some(h=>h.action==='SUPERVISOR_REVIEW')?'ADMIN':'SUPERVISOR';
 return mode;
}
export const reviewRoleAllowed=(required,role)=>['ADMIN','SUPERVISOR'].includes(role)&&(required==='BOTH'||required===role);
export function registrationActions(item={},role,values={}){
 const p={...values,...item.policySnapshot?.values},mode=p.REGISTRATION_APPROVAL_MODE||'BOTH',activator=p.REGISTRATION_ACTIVATOR||'BOTH';
 const submitted=['SUBMITTED','PENDING'].includes(item.registrationStatus),ready=item.registrationStatus==='SPV_APPROVED';
 const review=reviewRoleAllowed(mode==='SEQUENTIAL'?'SUPERVISOR':mode,role);
 return {mode,review:submitted&&review,reject:(submitted||ready&&mode==='SEQUENTIAL'&&role==='ADMIN')&&reviewRoleAllowed(mode==='SEQUENTIAL'?(ready?'ADMIN':'SUPERVISOR'):mode,role),activate:(ready||submitted&&mode==='NONE')&&reviewRoleAllowed(mode==='SEQUENTIAL'?'ADMIN':activator,role)};
}
