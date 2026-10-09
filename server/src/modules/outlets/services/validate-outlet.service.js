import { z } from 'zod';
import { prisma } from '../../../config/prisma.js';
import { config } from '../../../config/index.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { AppError } from '../../../utils/errors.js';
import { runReverseGeocode,runForwardGeocode,runFindPlace,runNearbySearch } from './outlet-validation.helpers.js';
import { compareOutletEvidence } from './compare-outlet-evidence.service.js';
import { actorSnapshot,locationSnapshot,lockOutlet,reviewOutlet } from './outlet-review-policy.service.js';
import { invalidateOutletCache } from './outlets.helpers.js';
import {outletComparisonPolicy} from './outlet-comparison-policy.service.js';
const request=z.object({reviewId:z.string().min(1),revision:z.number().int().positive()});
export async function validateOutlet(id,raw,actor) {
  const body=request.parse(raw);
  if(!await getDynamicConfig('OUTLET_MAP_COMPARISON_ENABLED',true))throw new AppError('Perbandingan peta dinonaktifkan Admin; pemeriksaan lapangan tetap tersedia.',403);
  if(await getDynamicConfig('FEATURE_MAPS_MODE','ACTIVE')!=='ACTIVE')throw new AppError('Layanan peta dinonaktifkan Admin; pemeriksaan lapangan tetap tersedia.',403);
  const outlet=await reviewOutlet(prisma,actor,id);
  const review=await prisma.outletReview.findFirst({where:{id:body.reviewId,outletId:id,status:{in:['OPEN','WAITING_FIELD']},revision:body.revision}});
  if(!review)throw new AppError('Kasus sudah berubah atau selesai. Muat ulang.',409);
  const comparisonPolicy=await outletComparisonPolicy();
  let result;
  if(!outlet.name?.trim()||!outlet.address?.trim()||!Number.isFinite(outlet.latitude)||!Number.isFinite(outlet.longitude)||Math.abs(outlet.latitude)>90||Math.abs(outlet.longitude)>180) {
    result={method:'MAP_COMPARISON_V2',code:'INCOMPLETE',signals:{},warnings:['Lengkapi nama, alamat, dan koordinat nyata sebelum membandingkan peta.'],suggestion:null,checkedAt:new Date().toISOString()};
  } else {
    const key=await getDynamicConfig('MAPS_API_KEY','') || config.googleMapsApiKey;
    if(!key)result={method:'MAP_COMPARISON_V2',code:'ERROR',signals:{},warnings:['Kunci layanan peta belum dikonfigurasi.'],suggestion:null,checkedAt:new Date().toISOString()};
    else {
      const [reverseGeocode,forwardGeocode,findPlace,nearbySearch]=await Promise.all([
        runReverseGeocode(outlet.latitude,outlet.longitude,key,comparisonPolicy),runForwardGeocode(outlet.address,key,null,comparisonPolicy),
        runFindPlace(outlet.name,outlet.address,key,outlet.latitude,outlet.longitude,null,comparisonPolicy),
        runNearbySearch(outlet.latitude,outlet.longitude,key,await getDynamicConfig('VALIDATION_NEARBY_RADIUS_METERS',200),comparisonPolicy)
      ]);
      result=compareOutletEvidence(outlet,{reverseGeocode,forwardGeocode,findPlace,nearbySearch},comparisonPolicy);
    }
  }
  result={comparisonPolicy,...result};
  await prisma.$transaction(async tx=>{
    await lockOutlet(tx,id);await reviewOutlet(tx,actor,id);
    const current=await tx.outlet.findUnique({where:{id}});
    if(current.updatedAt.getTime()!==outlet.updatedAt.getTime())throw new AppError('Data outlet berubah saat pemeriksaan. Muat ulang dan periksa kembali.',409);
    const changed=await tx.outletReview.updateMany({where:{id:review.id,revision:body.revision,status:{in:['OPEN','WAITING_FIELD']}},data:{revision:{increment:1}}});
    if(!changed.count)throw new AppError('Kasus berubah saat pemeriksaan. Muat ulang.',409);
    await tx.outletValidationRun.create({data:{reviewId:review.id,snapshot:locationSnapshot(outlet),result,actor:actorSnapshot(actor)}});
    if(result.code!=='ERROR')await tx.outlet.update({where:{id},data:{
      validationStatus:{CONSISTENT:'VALID',CONFLICT:'WARNING',AMBIGUOUS:'LIKELY_VALID',NO_EVIDENCE:'UNVALIDATED',INCOMPLETE:'INCOMPLETE'}[result.code],
      validationConfidence:null,validatedAt:new Date(),googleSuggestedLat:result.suggestion?.latitude ?? null,googleSuggestedLng:result.suggestion?.longitude ?? null,
      validationDetails:{...outlet.validationDetails,...result,stale:false,reviewId:review.id}
    }});
  });
  invalidateOutletCache();
  if(result.code==='ERROR')throw new AppError('Pemeriksaan peta belum selesai. Kegagalan tercatat; hasil sebelumnya tetap tersedia.',503);
  return result;
}
