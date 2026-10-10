import {reserveOutletProviderCall} from './outlet-provider-budget.service.js';
import {outletMapError} from './outlet-map-request.service.js';
import {outletNameUnusable} from '../../../../../shared/outlet-validation.mjs';
import {nativeOutletPointTrusted} from '../../../../../shared/outlet-location.mjs';
import {normalizeIndonesianStoreName} from './normalize-indonesian-store-name.service.js';
import {evaluateDigitalOutlet} from './outlet-digital-evaluator.service.js';
const fields='places.id,places.displayName,places.formattedAddress,places.addressComponents,places.location,places.businessStatus,places.types,places.googleMapsUri,places.attributions';
const normalize=p=>({detailsConfirmed:false,placeId:p.id,name:p.displayName?.text||'',address:p.formattedAddress||'',latitude:p.location?.latitude??null,longitude:p.location?.longitude??null,businessStatus:p.businessStatus||'UNKNOWN',types:p.types||[],mapsUrl:p.googleMapsUri||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.displayName?.text||'')}&query_place_id=${encodeURIComponent(p.id)}`,attributions:p.attributions||[],movedPlaceId:p.movedPlaceId||null,phone:p.internationalPhoneNumber||p.nationalPhoneNumber||null,city:p.addressComponents?.find(c=>c.types?.includes('administrative_area_level_2'))?.longText||null});
export async function searchGoogleOutlet(outlet,key,values,providerLimits={},fetcher=fetch,chosenId){
 const steps=[],found=new Map(),queries=new Set(),max=Number(values.OUTLET_REVIEW_MAX_CALLS??6),limit=Number(values.OUTLET_REVIEW_MAX_CANDIDATES??5),timeout=Number(values.OUTLET_REVIEW_TIMEOUT_SECONDS??10)*1000;
 const detailSlots=max>2?2:1,searchLimit=max-detailSlots;
 let serviceBlocked=false;
 const call=async(kind,strategy,url,options={})=>{
  if(serviceBlocked){steps.push({kind,strategy,state:'SKIPPED',reason:'Layanan ditolak atau kuota habis; panggilan lanjutan dihentikan'});return null;}
  if(steps.filter(s=>s.called).length>=max){steps.push({kind,strategy,state:'SKIPPED',reason:'Batas panggilan tercapai'});return null;}
  const step={kind,strategy,state:'ERROR',called:false};steps.push(step);
  try{await reserveOutletProviderCall({values:providerLimits});step.called=true;const response=await fetcher(url,{...options,signal:AbortSignal.timeout(timeout)});if(!response.ok){step.httpStatus=response.status;step.error=[401,403].includes(response.status)?'MAP_AUTHORIZATION_ERROR':response.status===429?'MAP_QUOTA_EXCEEDED':response.status===404?'MAP_PLACE_NOT_FOUND':'MAP_HTTP_ERROR';serviceBlocked=[401,403,429].includes(response.status);return null;}const data=await response.json();if(!data||typeof data!=='object'||data.error)throw new Error('MAP_PROVIDER_ERROR');step.state='SUCCESS';return data;}catch(e){step.error=outletMapError(e);serviceBlocked=step.error==='MAP_LOCAL_QUOTA_LIMIT';return null;}
 };
 const query=async(text,strategy,bias)=>{
  if(!text?.trim()){steps.push({kind:'TEXT',strategy,state:'SKIPPED',reason:'Petunjuk kosong'});return;}
  const queryKey=text.toLowerCase().replace(/\s+/g,' ').trim()+String(bias);
  if(queries.has(queryKey))return;queries.add(queryKey);
  if(steps.filter(s=>s.called).length>=searchLimit){steps.push({kind:'TEXT',strategy,state:'SKIPPED',reason:'Jatah tersisa dicadangkan untuk detail kandidat'});return;}
  const radius=strategy==='POINT_CONTEXT'?values.VALIDATION_NEARBY_RADIUS_METERS:values.OUTLET_REVIEW_SEARCH_RADIUS_METERS;
  const locationBias=bias&&nativeOutletPointTrusted(outlet)?{circle:{center:{latitude:outlet.latitude,longitude:outlet.longitude},radius:Number(radius??500)}}:{rectangle:{low:{latitude:-11,longitude:95},high:{latitude:6,longitude:141}}};
  const data=await call('TEXT',strategy,'https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':fields},body:JSON.stringify({textQuery:text,languageCode:'id',regionCode:'ID',pageSize:limit,locationBias})});
  if(data){if(data.places!=null&&!Array.isArray(data.places)){steps.at(-1).state='ERROR';steps.at(-1).error='Respons kandidat tidak valid';return;}steps.at(-1).state=data.places?.length?'SUCCESS':'EMPTY';for(const p of data.places||[])if(p?.id)found.set(p.id,normalize(p));}
 };
 const geocode=async(strategy,url)=>{
  const data=await call('GEOCODE',strategy,url);if(!data)return null;
  const step=steps.at(-1);
  if(data.status==='ZERO_RESULTS')step.state='EMPTY';
  else if(data.status==='OK'&&Array.isArray(data.results)&&data.results.length)step.state='SUCCESS';
  else{step.state='ERROR';step.error=data.status==='REQUEST_DENIED'?'MAP_AUTHORIZATION_ERROR':['OVER_QUERY_LIMIT','OVER_DAILY_LIMIT'].includes(data.status)?'MAP_QUOTA_EXCEEDED':'MAP_INVALID_RESPONSE';serviceBlocked=['MAP_AUTHORIZATION_ERROR','MAP_QUOTA_EXCEEDED'].includes(step.error);}
  return step.state==='SUCCESS'?data:null;
 };
 const region=outlet.cluster?.region||'',hint=outlet.searchHint||'',name=outlet.name?.trim(),address=outlet.address?.trim(),usableName=name&&!outletNameUnusable(name);
 const text=(...parts)=>[...new Set(parts.filter(Boolean)),'Indonesia'].join(' ');
 if(usableName){await query(text(name,address,region,hint),'NAME_ADDRESS_REGION',false);if(values.OUTLET_REVIEW_EXPAND_SEARCH!==false){const normalized=normalizeIndonesianStoreName(name);if(normalized&&normalized.toLowerCase()!==name.toLowerCase())await query(text(normalized,address,region,hint),'NAME_VARIANT',false);if(region||hint)await query(text(name,region,hint),'NAME_REGION_FALLBACK',false);if(nativeOutletPointTrusted(outlet))await query(text(name,region,hint),'TRUSTED_POINT',true);}}
 else if(address||region||hint)await query(text(name,address,region,hint),'ADDRESS_CONTEXT',false);
 else steps.push({kind:'TEXT',strategy:'MISSING_HINTS',state:'SKIPPED'});
 if(address?.length>=8&&!found.size)await geocode('ADDRESS_ONLY',`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent([address,region].filter(Boolean).join(' '))}&language=id&region=id&key=${encodeURIComponent(key)}`);
 if(!usableName&&nativeOutletPointTrusted(outlet)&&!found.size){
  let context=address;
  if(values.OUTLET_REVIEW_EXPAND_SEARCH!==false){const data=await geocode('POINT_ADDRESS_CONTEXT',`https://maps.googleapis.com/maps/api/geocode/json?latlng=${outlet.latitude},${outlet.longitude}&language=id&key=${encodeURIComponent(key)}`);context=data?.results?.[0]?.formatted_address||context;}
  await query([name||'toko',context,region].filter(Boolean).join(' '),'POINT_CONTEXT',true);
 }
 // Refresh the two best candidates rather than treating repeated search results as independent proof.
 const top=evaluateDigitalOutlet(outlet,[...found.values()],steps,values).candidates;
 const detailIds=[...new Set([chosenId,...top.map(c=>c.placeId)].filter(Boolean))].slice(0,detailSlots);
 for(const placeId of detailIds){const data=await call('DETAILS','CANDIDATE_DETAILS',`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=id`,{headers:{'X-Goog-Api-Key':key,'X-Goog-FieldMask':fields.replaceAll('places.','')+',movedPlaceId'+(outlet.phone?',internationalPhoneNumber,nationalPhoneNumber':'')}});if(data){if(data.id!==placeId){steps.at(-1).state='ERROR';steps.at(-1).error='MAP_PLACE_ID_MISMATCH';continue;}found.set(data.id,{...normalize(data),detailsConfirmed:true});}}
 // Keep the union for ambiguity checks; an early provider ordering must not discard a better candidate.
 return {candidates:[...found.values()],steps};
}
