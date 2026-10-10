import {isDeepStrictEqual} from 'node:util';
import {randomUUID} from 'node:crypto';
import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
import {prisma} from '../../../config/prisma.js';
import {config} from '../../../config/index.js';
import {AppError} from '../../../utils/errors.js';
import {getDynamicConfig} from '../../config/config.service.js';
import {currentPolicy} from '../../config/services/policy-context.service.js';
import {outletLocationBasis,outletOperationalPoint,sameOutletLocationBasis,nativeOutletPointTrusted,googleLocationRefreshAt} from '../../../../../shared/outlet-location.mjs';
import {knownPoint} from '../../../../../shared/outlet-validation.mjs';
import {calculateDistanceMeters} from '../../../utils/geolocation.js';
import {lockOutlet,reviewOutlet,actorSnapshot} from './outlet-review-policy.service.js';
import {reviewActor} from './outlet-review-access.service.js';
import {reserveOutletProviderCall} from './outlet-provider-budget.service.js';
import {evaluateDigitalOutlet} from './outlet-digital-evaluator.service.js';
import {invalidateOutletCache} from './outlets.helpers.js';

export async function acceptGoogleLocation(db,outlet,run,actor,reason){
 if(await getDynamicConfig('OUTLET_GOOGLE_LOCATION_ENABLED',true)===false)throw new AppError('Lokasi operasional Google dinonaktifkan. Gunakan bukti internal/lapangan.',409);
 if(nativeOutletPointTrusted(outlet)){
  if(!outlet.googleLocation||outlet.googleLocation.status==='SUPERSEDED')return undefined;
  await assertGoogleLocationIdle(db,outlet.id);
  await db.clusterRoute.deleteMany({where:{clusterId:outlet.clusterId}});
  return {source:'GOOGLE',status:'SUPERSEDED',placeId:run.result.selectedPlaceId};
 }
 const point=run.providerContent?.candidates?.find(c=>c.placeId===run.result.selectedPlaceId);
 if(!knownPoint(point)||!run.providerExpiresAt||+run.providerExpiresAt<=Date.now())throw new AppError('Cache titik Google belum tersedia atau kedaluwarsa. Periksa ulang.',409);
 // Use the same active-work guard as a native location correction, without copying provider coordinates into master/audit.
 await assertGoogleLocationIdle(db,outlet.id);
 const now=new Date(),days=await getDynamicConfig('OUTLET_GOOGLE_LOCATION_CACHE_DAYS',7);
 const expiresAt=new Date(Math.min(+run.providerExpiresAt,+now+Math.min(30,days)*86400000));
 const googleLocation={source:'GOOGLE',status:'ACTIVE',placeId:point.placeId,latitude:point.latitude,longitude:point.longitude,basis:outletLocationBasis(outlet),cachedAt:now.toISOString(),expiresAt:expiresAt.toISOString(),nextRefreshAt:googleLocationRefreshAt(now,expiresAt,await getDynamicConfig('OUTLET_GOOGLE_LOCATION_REFRESH_HOURS',24)),revision:(outlet.googleLocation?.revision||0)+1,approvedBy:actorSnapshot(actor),policyContext:{id:actor.id,role:actor.role,supervisorId:actor.supervisorId||null},runId:run.id,lastError:null};
 await db.clusterRoute.deleteMany({where:{clusterId:outlet.clusterId}});
 await db.auditEvent.create({data:{entityType:'OUTLET_LOCATION',entityId:outlet.id,action:'GOOGLE_ACCEPT',actorId:actor.id,actorName:actor.name,before:{source:outletOperationalPoint(outlet).source},after:{placeId:point.placeId,expiresAt:googleLocation.expiresAt,runId:run.id,reason}}});
 return googleLocation;
}
export async function assertGoogleLocationIdle(db,outletId){
 const [visits,deliveries,supervision]=await Promise.all([
  db.pjpStop.count({where:{outletId,OR:[{visitSession:{path:['state'],equals:'ACTIVE'}},{attendances:{some:{type:'IN'},none:{type:'OUT'}},status:{notIn:['VISITED','SKIPPED','CLOSED_REPORTED']}}]}}),
  db.deliveryStop.count({where:{outletId,arrivedAt:{not:null},completedAt:null,deliveryRoute:{status:'IN_TRANSIT',cancelledAt:null}}}),
  db.staffActivity.findMany({where:{kind:'VISIT',checkOutAt:null,activityKey:{in:(await db.pjpStop.findMany({where:{outletId},select:{id:true}})).map(s=>s.id)}},select:{checklist:true}}),
 ]);
 if(visits||deliveries||supervision.some(s=>s.checklist?.state!=='FINISHED'))throw new AppError('Lokasi sedang dipakai kunjungan/pengiriman aktif. Selesaikan sebelum menerapkan atau memperbarui titik Google.',409);
}
export async function refreshGoogleLocation(id,user,{fetcher=fetch,now=new Date(),automatic=false}={}){
 const actor=automatic?null:await reviewActor(prisma,user,'can_run_outlet_review');
 const outlet=automatic?await prisma.outlet.findFirst({where:{id,deletedAt:null}}):await reviewOutlet(prisma,actor,id);
 let g=outlet?.googleLocation;
 if(!g||g.status==='SUPERSEDED')throw new AppError('Belum ada lokasi Google yang disetujui.',409);
 const values=(automatic?await effectivePolicy(g.policyContext||{}):currentPolicy()||await effectivePolicy(actor)).values;
 if(values.FEATURE_OUTLET_REVIEW_MODE!=='ACTIVE'||values.OUTLET_GOOGLE_LOCATION_ENABLED===false||values.OUTLET_MAP_COMPARISON_ENABLED===false||values.FEATURE_MAPS_MODE!=='ACTIVE'||automatic&&values.OUTLET_GOOGLE_LOCATION_AUTO_REFRESH===false)throw new AppError('Pembaruan Google dinonaktifkan.',409);
 if(g.status!=='ACTIVE'||Date.parse(g.expiresAt)<=+now)throw new AppError('Lokasi perlu pemeriksaan dan persetujuan baru.',409);
 g=await prisma.$transaction(async db=>{
  await lockOutlet(db,id);const live=await db.outlet.findUnique({where:{id}});
  if(!isDeepStrictEqual(live.googleLocation,g)||Date.parse(g.refreshLeaseUntil)>+now)throw new AppError('Lokasi berubah atau sedang diperbarui. Muat ulang.',409);
  if(!sameOutletLocationBasis(outletLocationBasis(live),g.basis)){
   const next={...g,status:'CONFLICT',latitude:null,longitude:null,lastError:'MASTER_CHANGED',revision:g.revision+1};
   await db.outlet.update({where:{id},data:{googleLocation:next}});await db.clusterRoute.deleteMany({where:{clusterId:live.clusterId}});
   await db.auditEvent.create({data:{entityType:'OUTLET_LOCATION',entityId:id,action:'GOOGLE_CONFLICT',actorId:actor?.id||null,actorName:actor?.name||'Scheduler',before:{revision:g.revision},after:{status:'CONFLICT',revision:next.revision,placeId:g.placeId,reason:'MASTER_CHANGED'}}});return next;
  }
  await assertGoogleLocationIdle(db,id);
  const next={...g,refreshLeaseToken:randomUUID(),refreshLeaseUntil:new Date(+now+120000).toISOString()};
  await db.outlet.update({where:{id},data:{googleLocation:next}});return next;
 });
 if(g.status==='CONFLICT'){invalidateOutletCache();return {status:g.status,lastError:g.lastError,expiresAt:g.expiresAt};}
 const key=await getDynamicConfig('MAPS_API_KEY','')||config.googleMapsApiKey;
 let candidate,technicalError;
 try{
  if(!key)throw new Error('SERVER_KEY_MISSING');
  await reserveOutletProviderCall();
  const r=await fetcher(`https://places.googleapis.com/v1/places/${encodeURIComponent(g.placeId)}?languageCode=id`,{headers:{'X-Goog-Api-Key':key,'X-Goog-FieldMask':'id,displayName,formattedAddress,location,businessStatus,movedPlaceId,addressComponents,nationalPhoneNumber'},signal:AbortSignal.timeout((values.OUTLET_REVIEW_TIMEOUT_SECONDS||10)*1000)});
  if(!r.ok)throw new Error(`HTTP_${r.status}`);
  const p=await r.json();if(!p.id||!knownPoint(p.location?{latitude:p.location.latitude,longitude:p.location.longitude}:null))throw new Error('INVALID_PROVIDER_RESPONSE');
  candidate={placeId:p.id,name:p.displayName?.text||'',address:p.formattedAddress||'',latitude:p.location.latitude,longitude:p.location.longitude,phone:p.nationalPhoneNumber,businessStatus:p.businessStatus,movedPlaceId:p.movedPlaceId,city:p.addressComponents?.find(c=>c.types?.includes('administrative_area_level_2'))?.longText};
 }catch(e){technicalError=['SERVER_KEY_MISSING','MAP_LOCAL_QUOTA_LIMIT'].includes(e.message)?e.message:'PROVIDER_UNAVAILABLE';}
 const result=await prisma.$transaction(async db=>{
  await lockOutlet(db,id);if(actor)await reviewActor(db,user,'can_run_outlet_review');
  const current=await db.outlet.findUnique({where:{id}});
  if(!isDeepStrictEqual(current.googleLocation,g)||!sameOutletLocationBasis(outletLocationBasis(current),g.basis))throw new AppError('Lokasi/master berubah selama pembaruan. Periksa ulang.',409);
  let next={...g,refreshLeaseToken:null,refreshLeaseUntil:null,revision:g.revision+1,lastCheckedAt:now.toISOString(),nextRefreshAt:new Date(+now+3600000).toISOString()};
  if(technicalError)next={...next,lastError:technicalError,...(Date.parse(g.expiresAt)<=+now?{status:'EXPIRED',latitude:null,longitude:null}:{})};
  else{
   const result=evaluateDigitalOutlet(current,[candidate],[{state:'SUCCESS',kind:'DETAILS'}],values);
   const drift=knownPoint(g)?calculateDistanceMeters(g.latitude,g.longitude,candidate.latitude,candidate.longitude):null;
   if(result.code!=='STRONG'||candidate.placeId!==g.placeId||drift==null||drift>Number(values.OUTLET_GOOGLE_LOCATION_MAX_DRIFT_METERS??30))next={...next,status:'CONFLICT',latitude:null,longitude:null,lastError:'REVIEW_REQUIRED'};
   else{
    await assertGoogleLocationIdle(db,id);
    const expiry=new Date(+now+Math.min(30,Number(values.OUTLET_GOOGLE_LOCATION_CACHE_DAYS||7))*86400000);
    next={...next,status:'ACTIVE',latitude:candidate.latitude,longitude:candidate.longitude,cachedAt:now.toISOString(),expiresAt:expiry.toISOString(),nextRefreshAt:googleLocationRefreshAt(now,expiry,values.OUTLET_GOOGLE_LOCATION_REFRESH_HOURS||24),lastError:null};
   }
  }
  await db.clusterRoute.deleteMany({where:{clusterId:current.clusterId}});
  await db.outlet.update({where:{id},data:{googleLocation:next}});
  await db.auditEvent.create({data:{entityType:'OUTLET_LOCATION',entityId:id,action:'GOOGLE_REFRESH',actorId:actor?.id||null,actorName:actor?.name||'Scheduler',before:{revision:g.revision,status:g.status},after:{revision:next.revision,status:next.status,placeId:g.placeId,lastError:next.lastError}}});
  return {status:next.status,lastError:next.lastError,expiresAt:next.expiresAt};
 },{timeout:15000});invalidateOutletCache();return result;
}
export async function maintainGoogleLocations(now=new Date()){
 const rows=await prisma.$queryRaw`SELECT id,"googleLocation","deletedAt" FROM "Outlet" WHERE "googleLocation"->>'status'='ACTIVE' AND ("googleLocation"->>'expiresAt' <= ${now.toISOString()} OR "googleLocation"->>'nextRefreshAt' <= ${now.toISOString()}) ORDER BY "googleLocation"->>'expiresAt',id LIMIT 100`;
 let expired=0,refreshed=0,blocked=0,failed=0,conflicts=0,attempted=0;
 for(const row of rows){const g=row.googleLocation;if(g?.status!=='ACTIVE')continue;
  if(Date.parse(g.expiresAt)<=+now){await prisma.$transaction(async db=>{await lockOutlet(db,row.id);const live=await db.outlet.findUnique({where:{id:row.id}});if(!isDeepStrictEqual(live.googleLocation,g))return;await db.outlet.update({where:{id:row.id},data:{googleLocation:{...g,status:'EXPIRED',latitude:null,longitude:null,refreshLeaseToken:null,refreshLeaseUntil:null,revision:g.revision+1}}});await db.auditEvent.create({data:{entityType:'OUTLET_LOCATION',entityId:row.id,action:'GOOGLE_EXPIRED',actorName:'Scheduler',before:{status:g.status,revision:g.revision},after:{status:'EXPIRED',placeId:g.placeId,revision:g.revision+1}}});await db.clusterRoute.deleteMany({where:{clusterId:live.clusterId}});expired++;});continue;}
  if(row.deletedAt||attempted>=20||Date.parse(g.nextRefreshAt)>+now)continue;
  try{const result=await refreshGoogleLocation(row.id,null,{now,automatic:true});attempted++;if(result.status==='CONFLICT')conflicts++;else if(result.lastError)failed++;else refreshed++;}catch(e){if(!e.isOperational)throw e;blocked++;}
 }
 if(expired)invalidateOutletCache();return {expired,refreshed,blocked,failed,conflicts,attempted};
}
