import {assertEvidenceImages} from '../../../utils/evidence-images.js';
import {visitPolicy} from '../../../../../shared/operational-policy.mjs';
import {AppError} from '../../../utils/errors.js';
import {getDynamicConfig} from '../../config/config.service.js';
import {capturePolicySnapshot} from '../../config/services/process-policy.service.js';
import {reconcilePjp} from '../../route-changes/services/route-decision.service.js';
import {visitResultPolicyError} from '../../../../../shared/visit-outcome.mjs';
export async function visitSettings(stop){
 const snapshot=stop?.policySnapshot||await capturePolicySnapshot();
 return {...visitPolicy(snapshot.values),snapshot};
}
export async function flagVisit(db,stop,userId,source){
 const user=await db.user.findUnique({where:{id:userId},select:{supervisorId:true}});
 return db.operationalException.upsert({where:{dedupeKey:`MISSING_OUT:${stop.id}`},update:{},create:{dedupeKey:`MISSING_OUT:${stop.id}`,kind:'MISSING_OUT',entityId:stop.id,userId,supervisorId:user?.supervisorId,details:{outletName:stop.outlet?.name,source,startedAt:stop.attendances?.find(a=>a.type==='IN')?.timestamp||stop.visitSession?.startedAt,policyVersions:stop.policySnapshot?.versions||[]}}});
}
export async function settlePreviousVisit(db,userId,excludeId){
 const settled=[];
 const stops=await db.pjpStop.findMany({where:{id:{not:excludeId},pjp:{userId},status:'PENDING',OR:[{attendances:{some:{userId,type:'IN'},none:{userId,type:'OUT'}}},{visitSession:{path:['state'],equals:'ACTIVE'}}]},include:{attendances:true,outlet:true}});
 for(const stop of stops){
  const p=await visitSettings(stop);
  if(!p.allowContinue)throw new AppError('Selesaikan kunjungan aktif sebelum pindah outlet. Izin lanjut tanpa OUT belum aktif.',409);
  if(p.snapshot.values.SALES_REQUIRE_VISIT_RESULT&&!stop.visitSession?.result)throw new AppError('Catat hasil kunjungan sebelumnya sebelum pindah outlet.',409);
  if(p.requireOut)await flagVisit(db,stop,userId,'CONTINUE_NEXT_VISIT');
  const session={...stop.visitSession,state:p.requireOut?'INCOMPLETE':'FINISHED',finishedAt:new Date().toISOString(),finishSource:'CONTINUE_NEXT_VISIT',attendanceMode:p.mode};
  await db.pjpStop.update({where:{id:stop.id},data:{status:'VISITED',visitSession:session}});
  settled.push({id:stop.id,visitSession:session});
  await reconcilePjp(db,stop.pjpId);
 }
 return settled;
}
export async function validateVisitResult(payload){
 await assertEvidenceImages({attachments:payload.visitOutcome?.attachments});
 if(['COLLECTION','BOTH'].includes(payload.visitOutcome?.purpose)&&await getDynamicConfig('FEATURE_COLLECTION_MODE','ACTIVE')!=='ACTIVE')throw new AppError('Pencatatan penagihan baru dinonaktifkan oleh Admin',409);
 const keys=['SALES_REQUIRE_VISIT_RESULT','VISIT_RESULT_REQUIRE_NOTE','VISIT_RESULT_OFFER_MODE','VISIT_RESULT_OBSTACLE_MODE','VISIT_RESULT_ATTACHMENT_MODE'];
 const values=Object.fromEntries(await Promise.all(keys.map(async k=>[k,await getDynamicConfig(k)])));
 const error=visitResultPolicyError(payload.visitOutcome,values,payload.notes);
 if(error)throw new AppError(error,422);
}
