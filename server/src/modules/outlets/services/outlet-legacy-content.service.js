// Remove provider descriptions without rewriting business identity, field proof or decisions.
const providerKeys=new Set(['googleAddress','googlePlaceName','googleName','googlePhone','googleLat','googleLng','suggestedLat','suggestedLng','bestMatchName','nearbyPlaceNames','businessStatus','types','locationType','formattedAddress','formatted_address','displayName','vicinity','html_attributions','attributions','googleMapsUri','mapsUrl','rawResponse','rawProviderResponse']);
const candidateKeys=new Set(['placeId','id','nameScore','addressScore','phoneMatch','score','conflicts','distanceMeters']);
export function cleanLegacyOutletEvidence(value){
 if(Array.isArray(value))return value.map(cleanLegacyOutletEvidence);
 if(!value||typeof value!=='object')return value;
 return Object.fromEntries(Object.entries(value).filter(([key])=>!providerKeys.has(key)).map(([key,item])=>{
  if(['candidates','places','nearbyPlaces'].includes(key)&&Array.isArray(item))return [key,item.map(c=>Object.fromEntries(Object.entries(c).filter(([k])=>candidateKeys.has(k))))];
  return [key,cleanLegacyOutletEvidence(item)];
 }));
}
export function cleanProviderCache(content,expiresAt,createdAt,now=new Date()){
 const limit=Math.min(+new Date(expiresAt),+new Date(createdAt)+30*86400000);
 if(!content||!expiresAt||!Number.isFinite(limit)||limit<=+now)return {providerContent:null,providerExpiresAt:null};
 return {providerContent:{candidates:(content.candidates||[]).filter(c=>typeof c.placeId==='string').map(({placeId,latitude,longitude})=>({placeId,latitude,longitude}))},providerExpiresAt:new Date(limit)};
}
