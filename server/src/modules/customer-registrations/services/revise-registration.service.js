import {assertEvidenceImages} from '../../../utils/evidence-images.js';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {assertSalesAccess} from '../../../utils/team-scope.js';
import {processValue} from '../../config/services/process-policy.service.js';
import {registrationFieldError} from '../../../../../shared/registration-fields.mjs';
import {saveOutletPhoto} from '../customer-photo.service.js';
import {createRegistrationSchema} from '../customer-registrations.schema.js';
import {actorSnapshot} from '../../outlets/services/outlet-review-policy.service.js';
import {assertNoUnreviewedDuplicate} from '../../outlets/services/outlet-duplicates.service.js';
import {assertOutletLegal,assertOutletTrade,assertRequestReplay} from '../../outlets/services/outlet-data-policy.service.js';
import {broadcastCacheInvalidation} from '../../../config/socket.js';
import {sanitizeRegistrationPayload} from './sanitize-registration-payload.service.js';
import {registrationRevisionReadiness,registrationLocation} from '../../../../../shared/registration-policy.mjs';
async function assertRevisionPolicy(row){
 const values=Object.fromEntries(await Promise.all(['REGISTRATION_ALLOW_REVISION','REGISTRATION_MAX_REVISIONS','REGISTRATION_REVISION_DAYS'].map(async key=>[key,await processValue(row,key,key==='REGISTRATION_ALLOW_REVISION'?true:0)])));
 if(values.REGISTRATION_ALLOW_REVISION===false)throw new AppError('Perbaikan tidak diizinkan oleh aturan pengajuan ini.',403);
 const readiness=registrationRevisionReadiness(row,values);
 if(!readiness.allowed)throw new AppError(readiness.issues.join(' '),409);
}
export async function reviseRegistration(id,raw,actor) {
 const previous=await prisma.customerRegistration.findFirst({where:{id,deletedAt:null}});
 if(!previous)throw new AppError('Pengajuan tidak ditemukan',404);
 await assertSalesAccess(actor,previous.salesmanId);
 const {updatedAt,revisionReason,requestId,duplicateReason}=raw;
 const keys=[...Object.keys(createRegistrationSchema.shape.body.shape),'divisionId','divisionName'].filter(k=>!['requestId','registrationCode','duplicateReason'].includes(k));
 const input=sanitizeRegistrationPayload(Object.fromEntries(keys.filter(k=>raw[k]!==undefined).map(k=>[k,raw[k]])));
 const retry=(previous.revisionHistory || []).find(h=>h.requestId===requestId);
 if(retry)return assertRequestReplay(previous,input,actor,retry.actor.id);
 await assertRevisionPolicy(previous);
 const fieldError=registrationFieldError({...previous,...input},await processValue(previous,'REGISTRATION_SUBMIT_REQUIRED_FIELDS',''));if(fieldError)throw new AppError(fieldError,422);
 if(previous.registrationStatus!=='REJECTED')throw new AppError('Hanya pengajuan yang ditolak dapat diperbaiki dan diajukan ulang.',409);
 if(await processValue(previous,'CUSTOMER_REG_REQUIRE_PHOTO',true)&&!input.photoUrl?.trim())throw new AppError('Foto fisik outlet wajib dilampirkan',422);
 if(await processValue(previous,'CUSTOMER_REG_REQUIRE_TAX_DOCUMENT',true)&&!input.taxDocumentUrl?.trim())throw new AppError('Foto dokumen identitas wajib dilampirkan',422);
 try{Object.assign(input,registrationLocation({...previous,...input},await processValue(previous,'REGISTRATION_REQUIRE_LOCATION',true)));}catch(e){throw new AppError(e.message,422);}
 assertOutletLegal(input,previous);
 assertOutletTrade(input,previous);
 if(input.photoUrl&&input.photoUrl!==previous.photoUrl){const photo=await saveOutletPhoto(input.photoUrl,'PHOTO-REG',{entity:previous});input.photoUrl=photo.photoUrl;input.photoId=photo.photoId;}
 if(input.taxDocumentUrl!==previous.taxDocumentUrl)await assertEvidenceImages({taxDocumentUrl:input.taxDocumentUrl},{entity:previous});
 if(input.placeDetails)input.placeDetails={...input.placeDetails,source:'USER_SELECTED_PROFILE',verified:false};
 const result=await prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
  const current=await tx.customerRegistration.findUnique({where:{id}});
  const repeated=(current.revisionHistory || []).find(h=>h.requestId===requestId);
  if(repeated)return assertRequestReplay(current,input,actor,repeated.actor.id);
  if(current.registrationStatus!=='REJECTED'||current.updatedAt.toISOString()!==updatedAt)throw new AppError('Pengajuan sudah berubah. Muat ulang sebelum mengajukan revisi.',409);
  await assertRevisionPolicy(current);
  if(input.clusterId&&!await tx.cluster.findFirst({where:{id:input.clusterId,deletedAt:null,...(actor.role==='SUPERVISOR'?{supervisorId:actor.id}:actor.role==='SALES'?{OR:[{assignedSalesId:actor.id},{users:{some:{id:actor.id}}}]}:{})}}))throw new AppError('Wilayah di luar penugasan',403);
  await assertNoUnreviewedDuplicate(tx,input,actor,duplicateReason);
  const changed=Object.keys(input).filter(k=>!['photoUrl','taxDocumentUrl','placeDetails'].includes(k)&&JSON.stringify(input[k])!==JSON.stringify(current[k]));
  const history=[...(current.revisionHistory || []),{requestId,actor:actorSnapshot(actor),at:new Date().toISOString(),reason:revisionReason,rejectionNote:current.rejectionNote,before:Object.fromEntries(changed.map(k=>[k,current[k]??null])),after:Object.fromEntries(changed.map(k=>[k,input[k]]))}];
  return tx.customerRegistration.update({where:{id},data:{...input,revisionHistory:history,registrationStatus:'SUBMITTED',rejectionNote:null,spvId:null,spvName:null,spvApprovedAt:null}});
 });
 broadcastCacheInvalidation('customer-registrations');return result;
}
