import {getDynamicConfig} from '../../config/config.service.js';
import {GOOGLE_API_KEY} from './customer-registrations.helpers.js';
import {AppError} from '../../../utils/errors.js';

// Public place lookup is optional; disabling it never disables physical device GPS.
export async function placeLookupPolicy(){
 const mode=await getDynamicConfig('PLACE_LOOKUP_PROVIDER','AUTO');
 if(await getDynamicConfig('FEATURE_MAPS_MODE','ACTIVE')!=='ACTIVE'||mode==='OFF')throw new AppError('Pencarian alamat peta dinonaktifkan. Isi alamat manual dan gunakan GPS perangkat.',403);
 const key=await getDynamicConfig('MAPS_API_KEY','')||GOOGLE_API_KEY;
 const fallback=await getDynamicConfig('PLACE_LOOKUP_ALLOW_FALLBACK',true);
 const google=mode!=='OSM'&&Boolean(key);
 const osm=mode==='OSM'||fallback&&(mode==='AUTO'||mode==='GOOGLE');
 if(!google&&!osm)throw new AppError('Layanan pencarian alamat belum tersedia. Periksa provider dan kunci layanan di pengaturan.',503);
 return {google,osm,key,timeoutMs:1000*await getDynamicConfig('PLACE_LOOKUP_TIMEOUT_SECONDS',10)};
}
export async function fetchPlaceJson(url,policy,options={}){
 // Never include provider URLs/errors in logs: Google URLs contain a server key.
 try{
  const response=await fetch(url,{...options,signal:AbortSignal.timeout(policy.timeoutMs)});
  if(response.ok===false)throw new Error('HTTP failure');
  const data=await response.json();
  if(data?.status&&!['OK','ZERO_RESULTS'].includes(data.status))throw new Error('Provider failure');
  if(data?.error)throw new Error('Provider failure');
  return data;
 }catch{throw new AppError('Layanan peta belum merespons. Coba lagi atau isi alamat manual.',503);}
}
export const osmOptions={headers:{'User-Agent':'SinarAnugrahDistribution/1.0'}};
export function inferredArea(value=''){
 const text=String(value||'').toUpperCase();
 if(text.includes('BANDUNG BARAT'))return 'KAB_BANDUNG_BARAT';
 if(text.includes('KABUPATEN BANDUNG')||text.includes('KAB. BANDUNG'))return 'KAB_BANDUNG';
 if(text.includes('KOTA BANDUNG'))return 'KOTA_BANDUNG';
 if(text.includes('CIMAHI'))return 'CIMAHI';
 return null;
}
