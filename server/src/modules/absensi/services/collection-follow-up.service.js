import {getDynamicConfig} from '../../config/config.service.js';
import {featureAvailable} from '../../../../../shared/operational-policy.mjs';
import {currentPolicy} from '../../config/services/policy-context.service.js';
import {capturePolicySnapshot} from '../../config/services/process-policy.service.js';
import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
// A visit follow-up records work to do, never a financial balance or settlement.
export async function createCollectionFollowUp(db,{id,userId,outletName,visitOutcome},sourceKind) {
 if(!featureAvailable(currentPolicy()?.values,'COLLECTION')||!featureAvailable(currentPolicy()?.values,'FOLLOW_UP')||!await getDynamicConfig('COLLECTION_AUTO_FOLLOW_UP',true))return;
 if(visitOutcome?.result!=='PROMISED')return;
 const at=new Date().toISOString();
 return db.staffActivity.create({data:{userId,dateKey:wibDateKey(),activityKey:`COLLECTION:${sourceKind}:${id}`,kind:'COLLECTION_FOLLOW_UP',outletName,policySnapshot:await capturePolicySnapshot(),checkOutAt:new Date(),followUp:{
  ownerId:userId,createdBy:userId,createdAt:at,status:'OPEN',dueDate:visitOutcome.promiseDate,
  note:`Tindak lanjuti janji pembayaran ${visitOutcome.reference}. ${visitOutcome.note}`,
  sourceKind,sourceId:id,reference:visitOutcome.reference,
  history:[{action:'CREATED_FROM_VISIT',actorId:userId,at}],
 }}});
}
