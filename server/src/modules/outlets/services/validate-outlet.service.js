import {acceptGoogleLocation} from './outlet-google-location.service.js';
import {z} from 'zod';
import {prisma} from '../../../config/prisma.js';
import {config} from '../../../config/index.js';
import {getDynamicConfig} from '../../config/config.service.js';
import {capturePolicySnapshot} from '../../config/services/process-policy.service.js';
import {AppError} from '../../../utils/errors.js';
import {actorSnapshot,locationSnapshot,lockOutlet,reviewOutlet} from './outlet-review-policy.service.js';
import {invalidateOutletCache} from './outlets.helpers.js';
import {outletComparisonPolicy} from './outlet-comparison-policy.service.js';
import {searchGoogleOutlet} from './google-outlet-search.service.js';
import {evaluateDigitalOutlet,durableDigitalResult} from './outlet-digital-evaluator.service.js';
import {reviewActor} from './outlet-review-access.service.js';
import {rememberOutletCandidates,presentOutletRun} from './outlet-provider-content.service.js';
const schema=z.object({reviewId:z.string().min(1),revision:z.number().int().positive(),hint:z.string().trim().max(200).optional(),candidatePlaceId:z.string().trim().min(1).max(256).optional()}).strict();
export async function validateOutlet(id,raw,user){
 const body=schema.parse(raw),actor=await reviewActor(prisma,user,'can_run_outlet_review');
 if(await getDynamicConfig('OUTLET_MAP_COMPARISON_ENABLED',true)===false||await getDynamicConfig('FEATURE_MAPS_MODE','ACTIVE')!=='ACTIVE')throw new AppError('Pemeriksaan Google dinonaktifkan. Histori dan tindak lanjut tetap tersedia.',409);
 const outlet=await reviewOutlet(prisma,actor,id),review=await prisma.outletReview.findFirst({where:{id:body.reviewId,outletId:id,revision:body.revision,status:{notIn:['COMPLETED','CANCELLED']}}});
 if(!review)throw new AppError('Kasus berubah atau selesai. Muat ulang.',409);
 const previous=await prisma.outletValidationRun.findFirst({where:{reviewId:review.id},orderBy:{createdAt:'desc'}});
 const available=previous?presentOutletRun(previous).providerContent?.candidates||[]:[];
 const previousCandidates=available.filter(c=>c.descriptionAvailable&&c.name&&c.address);
 const previousResult=previous?.result,priorIdentity=previousResult?.identityReview;
 const previousIds=previousResult?.code==='AMBIGUOUS'||priorIdentity?.required&&!priorIdentity.resolved||priorIdentity?.missingPlaceIds?.length?[...new Set([previousResult.selectedPlaceId,...(priorIdentity?.competingPlaceIds||previousResult.candidateIds||[]),...(priorIdentity?.missingPlaceIds||[])].filter(Boolean))]:[];
 if(body.candidatePlaceId){if(!previous?.result?.candidateIds?.includes(body.candidatePlaceId))throw new AppError('Kandidat tidak berasal dari pemeriksaan terakhir. Muat ulang.',422);if(!previousCandidates.length||available.some(c=>c.descriptionAvailable===false))throw new AppError('Deskripsi perbandingan sebelumnya sudah tidak tersedia. Klik Periksa dengan Google untuk memuat kembali seluruh kandidat sebelum memilih ulang.',409);}
 const key=await getDynamicConfig('MAPS_API_KEY','')||config.googleMapsApiKey;
 const snapshot=await capturePolicySnapshot(),values=snapshot.values,policy=await outletComparisonPolicy();
 const search=key?await searchGoogleOutlet({...outlet,searchHint:body.hint},key,values,policy.providerLimits,fetch,body.candidatePlaceId,previousCandidates,previousIds):{candidates:[],steps:[{kind:'CONFIG',strategy:'SERVER_KEY',state:'ERROR',called:false,error:'Kunci Google pada server belum tersedia'}]};
 const result=evaluateDigitalOutlet(outlet,search.candidates,search.steps,values,body.candidatePlaceId);
 const missing=previousIds.filter(id=>!search.candidates.some(c=>c.placeId===id));
 if(missing.length){result.identityReview.comparisonIncomplete=true;result.identityReview.missingPlaceIds=missing;result.reasons.push(`${missing.length} kandidat dari hasil ambigu sebelumnya belum berhasil diperiksa kembali. Hilangnya hasil pencarian bukan bukti bahwa kandidat itu tidak sesuai.`);if(result.code==='STRONG')result.code='REVIEW';result.aligned=false;}
 // Retaining alternatives must never extend the lifetime of unrefreshed provider coordinates.
 if(result.candidates.some(c=>c.refreshed===false)&&previous?.providerExpiresAt)result.providerExpiresAt=new Date(Math.min(Date.parse(result.providerExpiresAt),+previous.providerExpiresAt)).toISOString();
 const durable=durableDigitalResult(result),now=new Date();
 await prisma.$transaction(async db=>{
  await lockOutlet(db,id);await reviewActor(db,user,'can_run_outlet_review');const current=await reviewOutlet(db,actor,id);
  if(current.updatedAt.getTime()!==outlet.updatedAt.getTime())throw new AppError('Master berubah selama pemeriksaan. Periksa ulang.',409);
  const live=await db.outletReview.findUnique({where:{id:review.id}});
  if(live.revision!==body.revision||['COMPLETED','CANCELLED'].includes(live.status))throw new AppError('Kasus berubah selama pemeriksaan.',409);
  const run=await db.outletValidationRun.create({data:{reviewId:review.id,snapshot:{...locationSnapshot(outlet),phone:outlet.phone},result:durable,actor:actorSnapshot(actor),providerContent:{candidates:result.candidates.map(({placeId,latitude,longitude})=>({placeId,latitude,longitude}))},providerExpiresAt:new Date(result.providerExpiresAt)}});
  rememberOutletCandidates(run.id,result.candidates.filter(c=>c.refreshed!==false));
  const tasks=await db.outletFieldTask.count({where:{reviewId:review.id,status:{in:['OPEN','SUBMITTED']}}});
  const auto=values.OUTLET_REVIEW_AUTO_CLOSE===true&&result.aligned&&result.technical==='READY'&&!tasks;
  await db.outletReview.update({where:{id:review.id},data:{revision:{increment:1},workflow:{...live.workflow,stage:auto?'COMPLETED':tasks?live.workflow?.stage||'WAITING_FIELD':'REVIEW',resultCode:result.code,runId:run.id,technical:result.code==='ERROR'?'ERROR':result.technical},...(auto?{status:'COMPLETED',closedAt:now,decision:{action:'DIGITAL_KEEP',note:'Master selaras menurut syarat bukti kuat.',actor:actorSnapshot(actor),at:now.toISOString(),runId:run.id}}:{})}});
  const googleLocation=auto&&values.OUTLET_GOOGLE_LOCATION_ENABLED!==false?await acceptGoogleLocation(db,current,run,actor,'Master selaras dengan bukti digital kuat'):undefined;
  if(result.code!=='ERROR')await db.outlet.update({where:{id},data:{...(googleLocation?{googleLocation}:{}),validationStatus:auto?'VALID':result.code==='STRONG'?'LIKELY_VALID':result.code==='INCOMPLETE'?'INCOMPLETE':'UNVALIDATED',validationConfidence:null,validatedAt:now,validationDetails:{method:result.method,code:result.code,identity:result.identity,location:result.location,reviewId:review.id,checkedAt:result.checkedAt,expiresAt:result.expiresAt,stale:false,...(auto?{decisionSource:'DIGITAL',qualityConfirmed:{source:'DIGITAL',version:result.version,name:outlet.name,address:outlet.address},placeId:result.selectedPlaceId,runId:run.id}:{})}}});
 });
 invalidateOutletCache();return result;
}
