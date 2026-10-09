import {getDistanceInMeters} from './customer-registrations.helpers.js';
import {getDynamicConfig} from '../../config/config.service.js';
import {placeLookupPolicy,fetchPlaceJson,osmOptions,inferredArea} from './place-lookup-policy.service.js';

export const searchPlaces=async(keyword,lat=null,lng=null)=>{
 if(!keyword||keyword.trim().length<2)return [];
 const policy=await placeLookupPolicy();
 const userLat=lat!=null&&Number.isFinite(Number(lat))?Number(lat):await getDynamicConfig('DEFAULT_OFFICE_LATITUDE',-6.8722);
 const userLng=lng!=null&&Number.isFinite(Number(lng))?Number(lng):await getDynamicConfig('DEFAULT_OFFICE_LONGITUDE',107.5422);
 const radius=await getDynamicConfig('CUSTOMER_REG_PLACES_RADIUS_METERS',100);
 const enforce=await getDynamicConfig('CUSTOMER_REG_ENFORCE_PLACES_RADIUS',true);
 const browserKey=await getDynamicConfig('MAPS_BROWSER_API_KEY','');
 const distanceOrigin=lat!=null&&lng!=null?'INPUT_COORDINATES':'OFFICE_SEARCH_BIAS';
 const results=[];let error;
 const append=point=>{
  if(!Number.isFinite(point.latitude)||!Number.isFinite(point.longitude))return;
  const distanceMeters=getDistanceInMeters(userLat,userLng,point.latitude,point.longitude);
  if(enforce&&distanceMeters>radius)return;
  results.push({...point,distanceMeters,distanceOrigin,latitude:Number(point.latitude.toFixed(6)),longitude:Number(point.longitude.toFixed(6))});
 };
 if(policy.google){
  try{
   const url=`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword.trim())}&location=${userLat},${userLng}&radius=${radius}&key=${policy.key}`;
   const data=await fetchPlaceJson(url,policy);
   for(const item of data?.results||[])append({
    placeId:item.place_id,name:item.name,address:item.formatted_address,
    latitude:item.geometry?.location?.lat,longitude:item.geometry?.location?.lng,
    rating:item.rating??null,userRatingsTotal:item.user_ratings_total??null,types:item.types||[],
    openNow:item.opening_hours?.open_now??null,
    openingHoursText:typeof item.opening_hours?.open_now==='boolean'?(item.opening_hours.open_now?'Sedang buka menurut penyedia peta':'Sedang tutup menurut penyedia peta'):null,
    plusCode:item.plus_code?.compound_code??null,phone:item.formatted_phone_number??null,
    photoUrl:browserKey&&item.photos?.[0]?.photo_reference?`https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${encodeURIComponent(item.photos[0].photo_reference)}&key=${encodeURIComponent(browserKey)}`:null,categoryName:null,deliveryInfo:[],area:inferredArea(item.formatted_address),
    googleMapsUrl:item.place_id?`https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(item.place_id)}`:null,source:'GOOGLE_PLACE',
   });
  }catch(e){error=e;}
 }
 if(!results.length&&policy.osm){
  try{
   const data=await fetchPlaceJson(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword.trim())}&format=json&addressdetails=1&limit=5`,policy,osmOptions);
   if(Array.isArray(data))for(const item of data){
    const address=item.address||{};
    append({placeId:`osm-${item.osm_type||'place'}-${item.osm_id}`,name:item.name||item.display_name?.split(',')[0],address:item.display_name,
     latitude:parseFloat(item.lat),longitude:parseFloat(item.lon),subAreaKecamatan:address.suburb||address.municipality||'',kelurahan:address.village||address.quarter||'',
     rating:null,userRatingsTotal:null,categoryName:null,openNow:null,openingHoursText:null,plusCode:null,phone:null,photoUrl:null,deliveryInfo:[],
     area:inferredArea(address.county||address.city||address.state_district),googleMapsUrl:null,
     mapUrl:`https://www.openstreetmap.org/?mlat=${encodeURIComponent(item.lat)}&mlon=${encodeURIComponent(item.lon)}#map=18/${encodeURIComponent(item.lat)}/${encodeURIComponent(item.lon)}`,source:'OSM_NOMINATIM',
    });
   }
   error=null;
  }catch(e){error=e;}
 }
 if(!results.length&&error)throw error;
 return results;
};
