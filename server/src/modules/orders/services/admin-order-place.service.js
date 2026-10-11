import {getDynamicConfig} from '../../config/config.service.js';
import {GOOGLE_API_KEY} from '../../customer-registrations/services/customer-registrations.helpers.js';
import {AppError} from '../../../utils/errors.js';
import {prisma} from '../../../config/prisma.js';

const valid=point=>Number.isFinite(point?.lat)&&Number.isFinite(point?.lng)&&Math.abs(point.lat)<=90&&Math.abs(point.lng)<=180;
async function googleJson(url,{key,timeoutMs},options={}){
 try{
  const response=await fetch(url,{...options,headers:{...options.headers,'X-Goog-Api-Key':key},signal:AbortSignal.timeout(timeoutMs)});
  if(!response.ok)throw new Error('Google Places unavailable');
  return await response.json();
 }catch{throw new AppError('Google Places belum merespons. Coba lagi sebelum menyimpan order.',503);}
}
async function policy(){
 if(await getDynamicConfig('FEATURE_MAPS_MODE','ACTIVE')!=='ACTIVE')throw new AppError('Peta Google dinonaktifkan. Admin belum dapat membuat order dengan titik pengiriman.',409);
 const key=await getDynamicConfig('MAPS_API_KEY','')||GOOGLE_API_KEY;
 if(!key)throw new AppError('Kunci Google Maps belum tersedia di server.',503);
 return {key,timeoutMs:1000*await getDynamicConfig('PLACE_LOOKUP_TIMEOUT_SECONDS',10)};
}
export async function searchAdminOrderPlaces(outletId,query){
 const outlet=await prisma.outlet.findFirst({where:{id:outletId,deletedAt:null}});
 if(!outlet)throw new AppError('Outlet tidak ditemukan',404);
 const requestPolicy=await policy();
 const text=(query?.trim()||`${outlet.name} ${outlet.address}`).slice(0,250);
 if(text.length<3)throw new AppError('Isi nama atau alamat toko minimal 3 karakter.',400);
 const locationBias=Number.isFinite(outlet.latitude)&&Number.isFinite(outlet.longitude)?{circle:{center:{latitude:outlet.latitude,longitude:outlet.longitude},radius:5000}}:undefined;
 const data=await googleJson('https://places.googleapis.com/v1/places:searchText',requestPolicy,{method:'POST',headers:{'Content-Type':'application/json','X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.location,places.businessStatus'},body:JSON.stringify({textQuery:text,languageCode:'id',regionCode:'ID',pageSize:10,locationBias})});
 return (data.places||[]).filter(place=>place.id&&valid({lat:place.location?.latitude,lng:place.location?.longitude})).map(place=>({placeId:place.id,name:place.displayName?.text||'-',address:place.formattedAddress||'',latitude:place.location.latitude,longitude:place.location.longitude,businessStatus:place.businessStatus||'UNKNOWN'}));
}
export async function resolveAdminOrderPlace(placeId){
 const requestPolicy=await policy();
 const place=await googleJson(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=id`,requestPolicy,{headers:{'X-Goog-FieldMask':'id,displayName,formattedAddress,location,businessStatus,movedPlaceId'}});
 if(!place||place.id!==placeId||!valid({lat:place.location?.latitude,lng:place.location?.longitude}))throw new AppError('Titik Google tidak tersedia lagi. Cari dan pilih ulang toko.',409);
 if(place.businessStatus==='CLOSED_PERMANENTLY'||place.movedPlaceId)throw new AppError('Google menandai toko tutup permanen atau pindah. Pilih titik terbaru.',422);
 return {placeId,name:place.displayName?.text||'-',address:place.formattedAddress||'',latitude:place.location.latitude,longitude:place.location.longitude,source:'GOOGLE_ORDER_ADMIN',recordedAt:new Date().toISOString()};
}
