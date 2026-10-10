import {reserveOutletProviderCall} from './outlet-provider-budget.service.js';
import {outletMapError} from './outlet-map-request.service.js';
import {knownPoint,outletIssues,outletNameUnusable} from '../../../../../shared/outlet-validation.mjs';
import {normalizeIndonesianStoreName} from './normalize-indonesian-store-name.service.js';
import {evaluateDigitalOutlet} from './outlet-digital-evaluator.service.js';
const fields='places.id,places.displayName,places.formattedAddress,places.addressComponents,places.location,places.businessStatus,places.types,places.googleMapsUri,places.attributions';
const normalize=p=>({detailsConfirmed:false,placeId:p.id,name:p.displayName?.text||'',address:p.formattedAddress||'',latitude:p.location?.latitude??null,longitude:p.location?.longitude??null,businessStatus:p.businessStatus||'UNKNOWN',types:p.types||[],mapsUrl:p.googleMapsUri||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.displayName?.text||'')}&query_place_id=${encodeURIComponent(p.id)}`,attributions:p.attributions||[],movedPlaceId:p.movedPlaceId||null,phone:p.internationalPhoneNumber||p.nationalPhoneNumber||null,city:p.addressComponents?.find(c=>c.types?.includes('administrative_area_level_2'))?.longText||null});
export async function searchGoogleOutlet(outlet,key,values,providerLimits={},fetcher=fetch,chosenId){
 const steps=[],found=new Map(),max=Number(values.OUTLET_REVIEW_MAX_CALLS??6),limit=Number(values.OUTLET_REVIEW_MAX_CANDIDATES??5),timeout=Number(values.OUTLET_REVIEW_TIMEOUT_SECONDS??10)*1000;
 const call=async(kind,strategy,url,options={})=>{
  if(steps.filter(s=>s.called).length>=max){steps.push({kind,strategy,state:'SKIPPED',reason:'Batas panggilan tercapai'});return null;}
  const step={kind,strategy,state:'ERROR',called:false};steps.push(step);
  try{await reserveOutletProviderCall({values:providerLimits});step.called=true;const response=await fetcher(url,{...options,signal:AbortSignal.timeout(timeout)});if(!response.ok)throw new Error(response.status===429?'MAP_LOCAL_QUOTA_LIMIT':'MAP_HTTP_ERROR');const data=await response.json();if(data.error)throw new Error('MAP_PROVIDER_ERROR');step.state='SUCCESS';return data;}catch(e){step.error=outletMapError(e);return null;}
 };
 const query=async(text,strategy,bias)=>{
  if(!text?.trim()){steps.push({kind:'TEXT',strategy,state:'SKIPPED',reason:'Petunjuk kosong'});return;}
  const radius=strategy==='POINT_CONTEXT'?values.VALIDATION_NEARBY_RADIUS_METERS:values.OUTLET_REVIEW_SEARCH_RADIUS_METERS;
  const data=await call('TEXT',strategy,'https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':fields},body:JSON.stringify({textQuery:text,languageCode:'id',regionCode:'ID',pageSize:limit,...(bias?{locationBias:{circle:{center:{latitude:outlet.latitude,longitude:outlet.longitude},radius:Number(radius??500)}}}:{})})});
  if(data){if(data.places!=null&&!Array.isArray(data.places)){steps.at(-1).state='ERROR';steps.at(-1).error='Respons kandidat tidak valid';return;}steps.at(-1).state=data.places?.length?'SUCCESS':'EMPTY';for(const p of data.places||[])if(p.id)found.set(p.id,normalize(p));}
 };
 const region=outlet.cluster?.region||'',name=outlet.name?.trim(),address=outlet.address?.trim(),usableName=name&&!outletNameUnusable(name);
 if(usableName){await query([name,address,region].filter(Boolean).join(' '),'NAME_ADDRESS_REGION',false);if(values.OUTLET_REVIEW_EXPAND_SEARCH!==false){const normalized=normalizeIndonesianStoreName(name);if(normalized&&normalized.toLowerCase()!==name.toLowerCase())await query([normalized,address,region].filter(Boolean).join(' '),'NAME_VARIANT',false);if(knownPoint(outlet)&&!outletIssues(outlet).includes('UNCONFIRMED_POINT'))await query([name,region].filter(Boolean).join(' '),'TRUSTED_POINT',true);}}
 else if(address||region)await query([name,address,region].filter(Boolean).join(' '),'ADDRESS_CONTEXT',false);
 else steps.push({kind:'TEXT',strategy:'MISSING_HINTS',state:'SKIPPED'});
 if(address?.length>=8&&!found.size){const data=await call('GEOCODE','ADDRESS_ONLY',`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent([address,region].filter(Boolean).join(' '))}&language=id&region=id&key=${encodeURIComponent(key)}`);if(data)steps.at(-1).state=data.status==='OK'?'SUCCESS':data.status==='ZERO_RESULTS'?'EMPTY':'ERROR';}
 if(!usableName&&knownPoint(outlet)&&!found.size){
  let context=address;
  if(values.OUTLET_REVIEW_EXPAND_SEARCH!==false&&!outletIssues(outlet).includes('UNCONFIRMED_POINT')){const data=await call('GEOCODE','POINT_ADDRESS_CONTEXT',`https://maps.googleapis.com/maps/api/geocode/json?latlng=${outlet.latitude},${outlet.longitude}&language=id&key=${encodeURIComponent(key)}`);if(data){steps.at(-1).state=data.status==='OK'?'SUCCESS':data.status==='ZERO_RESULTS'?'EMPTY':'ERROR';context=data.status==='OK'?data.results?.[0]?.formatted_address||context:context;}}
  await query([name||'toko',context,region].filter(Boolean).join(' '),'POINT_CONTEXT',true);
 }
 // Refresh the two best candidates rather than treating repeated search results as independent proof.
 const top=evaluateDigitalOutlet(outlet,[...found.values()],steps,values).candidates.slice(0,2);
 for(const placeId of [...new Set([chosenId,...top.map(c=>c.placeId)].filter(Boolean))]){const data=await call('DETAILS','CANDIDATE_DETAILS',`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=id`,{headers:{'X-Goog-Api-Key':key,'X-Goog-FieldMask':fields.replaceAll('places.','')+',movedPlaceId'+(outlet.phone?',internationalPhoneNumber,nationalPhoneNumber':'')}});if(data?.id)found.set(data.id,{...normalize(data),detailsConfirmed:true});}
 return {candidates:[...found.values()].slice(0,limit*2),steps};
}
