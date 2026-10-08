import { useEffect, useState } from 'react';
import { deliveryApi, collectPages } from '../../services/api';

export function useDriverTracking(user) {
  const [state,setState]=useState({status:'IDLE'});
  useEffect(()=>{
    if(user?.role!=='SUPIR'){setState({status:'IDLE'});return;}
    setState({status:'IDLE'});
    let disposed=false, route=null, watch=null, lastSent=0, sending=false, restartRequested=false, generation=0;
    const set=value=>{if(!disposed)setState(previous=>({...previous,...value}));};
    const stop=()=>{generation++;if(watch!=null)navigator.geolocation?.clearWatch(watch);watch=null;};
    const start=()=>{
      const watchedRouteId=route?.id, watchedGeneration=generation;
      if(!navigator.geolocation){set({status:'UNAVAILABLE',message:'Ponsel/browser tidak menyediakan GPS. Titik absensi tetap digunakan.'});return;}
      set({status:'WAITING',message:'Menunggu izin dan posisi GPS ponsel…'});
      watch=navigator.geolocation.watchPosition(async pos=>{
        if(disposed||generation!==watchedGeneration||!route||route.id!==watchedRouteId||sending||Date.now()-lastSent<30000)return;
        if(Date.now()-pos.timestamp>120000){set({status:'STALE',message:'Posisi GPS sudah lama; menunggu posisi baru.'});return;}
        sending=true;const target=route;
        try{
          const res=await deliveryApi.reportLocation(target.id,{latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:pos.coords.accuracy,observedAt:new Date(pos.timestamp).toISOString()});
          if(!disposed&&generation===watchedGeneration&&route?.id===target.id&&res.data?.accepted){lastSent=Date.now();set({status:document.visibilityState==='hidden'?'BACKGROUND':'LIVE',at:pos.timestamp,sentAt:lastSent,routeCode:target.code,message:document.visibilityState==='hidden'?'Posisi terkirim dari latar belakang; browser dapat menghentikan pembaruan kapan saja.':'Lokasi ponsel dibagikan untuk trip ini.'});}
        }catch(error){if(!disposed&&generation===watchedGeneration&&route?.id===target.id)set({status:'ERROR',message:`Lokasi belum terkirim: ${error.message}`});}finally{sending=false;}
      },err=>{if(disposed||generation!==watchedGeneration||route?.id!==watchedRouteId)return;if(err.code===1)stop();set({status:err.code===1?'DENIED':'UNAVAILABLE',message:err.code===1?'Izin GPS ditolak. Aktifkan izin lokasi browser lalu kembali ke halaman ini. Gudang melihat posisi terakhir yang tersedia.':'GPS belum tersedia. Gudang melihat posisi terakhir yang tersedia.'});},{enableHighAccuracy:true,maximumAge:10000,timeout:20000});
    };
    let querying=false;
    const sync=async()=>{
      if(navigator.onLine===false){offline();return;}
      if(querying)return;querying=true;
      try{
        const response=await collectPages(deliveryApi.getDeliveryRoutes,{open:'true'});
        if(disposed)return;
        if(navigator.onLine===false){offline();return;}
        const candidates=response.data.filter(r=>['IN_TRANSIT','COMPLETED','PARTIAL'].includes(r.status)&&!r.returnedAt&&!r.closedAt&&!r.cancelledAt);
        const next=candidates.length===1?candidates[0]:null;
        if(next?.id!==route?.id||restartRequested){const changed=next?.id!==route?.id;stop();route=next;lastSent=0;restartRequested=false;if(changed)set({at:null,sentAt:null,routeCode:next?.code||null});if(route)start();}
        if(!next){stop();route=null;set({status:'IDLE',message:candidates.length>1?'Ada beberapa trip aktif. Gudang perlu menyelesaikan bentrok sebelum pelacakan.':'GPS trip aktif setelah berangkat hingga kembali gudang.'});}
      }catch(error){stop();route=null;set({status:'ERROR',message:`Tidak dapat memeriksa trip: ${error.message}`});}finally{querying=false;}
    };
    const freshness=()=>setState(previous=>['LIVE','BACKGROUND'].includes(previous.status)&&Date.now()-previous.at>120000?{...previous,status:'STALE',message:'GPS belum memperbarui posisi selama lebih dari 2 menit. Gudang melihat posisi terakhir.'}:previous);
    const resume=()=>{freshness();restartRequested=true;sync();};
    const visibility=()=>{if(document.visibilityState==='visible')resume();else if(route)setState(previous=>['LIVE','BACKGROUND'].includes(previous.status)?{...previous,status:'BACKGROUND',message:'Halaman berada di latar belakang. Browser dapat menghentikan GPS; periksa posisi terakhir saat kembali.'}:previous);};
    const offline=()=>{stop();restartRequested=true;set({status:'OFFLINE',message:'Perangkat offline. Lokasi baru belum dapat dikirim; gudang melihat posisi terakhir.'});};
    const freshnessTimer=setInterval(freshness,15000);
    sync();const timer=setInterval(sync,30000);window.addEventListener('delivery:changed',sync);window.addEventListener('online',resume);window.addEventListener('offline',offline);window.addEventListener('focus',resume);document.addEventListener('visibilitychange',visibility);
    return()=>{disposed=true;stop();clearInterval(timer);clearInterval(freshnessTimer);window.removeEventListener('delivery:changed',sync);window.removeEventListener('online',resume);window.removeEventListener('offline',offline);window.removeEventListener('focus',resume);document.removeEventListener('visibilitychange',visibility);};
  },[user?.id,user?.role]);
  return state;
}
