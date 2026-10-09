import {useCallback,useEffect,useRef,useState} from 'react';
import {useApp} from '../../context/AppContext';
import {getDetailedAddressFromGps} from '../../services/reverseGeocodeService';
const valid=(lat,lng)=>Number.isFinite(lat)&&Number.isFinite(lng);
export function useAddressLookup({address,onChange,autoLocation=null,autoEnabled=true}){
 const {settings,settingsReady}=useApp();
 const lookupEnabled=settingsReady&&settings.FEATURE_MAPS_MODE==='ACTIVE'&&settings.PLACE_LOOKUP_PROVIDER!=='OFF';
 const live=useRef({});live.current={enabled:lookupEnabled,onChange};
 const manual=useRef(Boolean(address)),flight=useRef(0),last=useRef('');
 const [isGeocodingLoading,setLoading]=useState(false),[isAddressAutoFetched,setAuto]=useState(false),[lookupError,setError]=useState('');
 useEffect(()=>()=>{flight.current++;},[]);
 useEffect(()=>{if(!lookupEnabled){flight.current++;setLoading(false);}},[lookupEnabled]);
 const fetchAddressFromCoords=useCallback(async(lat,lng,force=false)=>{
  if(!live.current.enabled||!valid(lat,lng)||manual.current)return;
  const key=`${lat}:${lng}`;if(!force&&last.current===key)return;last.current=key;
  const version=++flight.current;setLoading(true);setError('');
  try{
   const text=await getDetailedAddressFromGps(lat,lng);
   if(version!==flight.current||!live.current.enabled||manual.current)return;
   if(text){live.current.onChange(text);setAuto(true);}else setError('Alamat tidak ditemukan. Isi alamat secara manual.');
  }catch(error){if(version===flight.current&&live.current.enabled){last.current='';setError(error.message);}}
  finally{if(version===flight.current)setLoading(false);}
 },[]);
 useEffect(()=>{if(autoEnabled&&autoLocation)fetchAddressFromCoords(autoLocation.lat,autoLocation.lng);},[autoEnabled,autoLocation,fetchAddressFromCoords]);
 const handleAddressChange=useCallback(value=>{manual.current=true;flight.current++;setLoading(false);setAuto(false);setError('');live.current.onChange(value);},[]);
 const refresh=useCallback(location=>{
  if(!live.current.enabled)return;
  manual.current=false;
  if(valid(location?.lat,location?.lng)){fetchAddressFromCoords(location.lat,location.lng,true);return;}
  if(!navigator.geolocation){setError('GPS tidak tersedia. Isi alamat secara manual.');return;}
  const version=++flight.current;setLoading(true);setError('');
  navigator.geolocation.getCurrentPosition(pos=>{
   if(version===flight.current&&live.current.enabled)fetchAddressFromCoords(pos.coords.latitude,pos.coords.longitude,true);
  },()=>{if(version===flight.current){setLoading(false);setError('Lokasi belum diperoleh. Isi alamat secara manual atau coba lagi.');}},{enableHighAccuracy:true,timeout:6000});
 },[fetchAddressFromCoords]);
 return {lookupEnabled,lookupError,isGeocodingLoading,isAddressAutoFetched,fetchAddressFromCoords,handleAddressChange,refresh};
}
