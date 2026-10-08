import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
// A visit follow-up records work to do, never a financial balance or settlement.
export async function createCollectionFollowUp(db,{id,userId,outletName,visitOutcome},sourceKind) {
 if(visitOutcome?.result!=='PROMISED')return;
 const at=new Date().toISOString();
 return db.staffActivity.create({data:{userId,dateKey:wibDateKey(),activityKey:`COLLECTION:${sourceKind}:${id}`,kind:'COLLECTION_FOLLOW_UP',outletName,checkOutAt:new Date(),followUp:{
  ownerId:userId,createdBy:userId,createdAt:at,status:'OPEN',dueDate:visitOutcome.promiseDate,
  note:`Tindak lanjuti janji pembayaran ${visitOutcome.reference}. ${visitOutcome.note}`,
  sourceKind,sourceId:id,reference:visitOutcome.reference,
  history:[{action:'CREATED_FROM_VISIT',actorId:userId,at}],
 }}});
}
