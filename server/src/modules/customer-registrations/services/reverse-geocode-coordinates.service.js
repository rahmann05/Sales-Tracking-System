import {AppError} from '../../../utils/errors.js';
import {placeLookupPolicy,fetchPlaceJson,osmOptions,inferredArea} from './place-lookup-policy.service.js';

export const reverseGeocodeCoordinates=async(lat,lng)=>{
 if(lat==null||lng==null||String(lat).trim()===''||String(lng).trim()===''||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng))||Math.abs(Number(lat))>90||Math.abs(Number(lng))>180)throw new AppError('Koordinat lokasi tidak valid.',400);
 const policy=await placeLookupPolicy();
 const result={address:'',subAreaKecamatan:'',kelurahan:'',area:null,latitude:Number(Number(lat).toFixed(6)),longitude:Number(Number(lng).toFixed(6)),googleMapsUrl:`https://www.google.com/maps/search/?api=1&query=${Number(lat)},${Number(lng)}`};
 let error;
 if(policy.google){
  try{
   const data=await fetchPlaceJson(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${Number(lat)},${Number(lng)}&key=${policy.key}`,policy);
   const top=data?.results?.[0];
   if(top){
    result.address=top.formatted_address||'';result.source='GOOGLE_GEOCODE';
    for(const comp of top.address_components||[]){
     const types=comp.types||[],name=comp.long_name||'';
     if(types.includes('administrative_area_level_3')||types.includes('locality'))result.subAreaKecamatan=name.replace(/Kecamatan\s*/i,'');
     if(types.includes('administrative_area_level_4')||types.includes('sublocality'))result.kelurahan=name.replace(/Kelurahan\s*|Desa\s*/i,'');
     if(types.includes('administrative_area_level_2'))result.area=inferredArea(name);
    }
   }
  }catch(e){error=e;}
 }
 if(!result.address&&policy.osm){
  try{
   const data=await fetchPlaceJson(`https://nominatim.openstreetmap.org/reverse?lat=${Number(lat)}&lon=${Number(lng)}&format=json&addressdetails=1`,policy,osmOptions);
   if(data?.address){
    const address=data.address;
    result.address=data.display_name||'';result.source='OSM_NOMINATIM';
    result.subAreaKecamatan=address.suburb||address.municipality||address.city_district||address.town||'';
    result.kelurahan=address.village||address.quarter||address.neighbourhood||'';
    result.area=inferredArea(address.county||address.city||address.state_district);
   }
   error=null;
  }catch(e){error=e;}
 }
 if(!result.address&&error)throw error;
 return result;
};
