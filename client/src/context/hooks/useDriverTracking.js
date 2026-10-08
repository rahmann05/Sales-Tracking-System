import { useEffect, useState } from 'react';
import { deliveryApi, collectPages } from '../../services/api';

export function useDriverTracking(user) {
  const [state,setState]=useState({status:'IDLE'});
  useEffect(()=>{
    if(user?.role!=='SUPIR'){setState({status:'IDLE'});return;}
    let disposed=false, route=null, watch=null, lastSent=0, sending=false;
    const set=value=>{if(!disposed)setState(value);};
    const stop=()=>{if(watch!=null)navigator.geolocation?.clearWatch(watch);watch=null;};
    const start=()=>{
      if(!navigator.geolocation){set({status:'UNAVAILABLE',message:'Ponsel/browser tidak menyediakan GPS. Titik absensi tetap digunakan.'});return;}
      set({status:'WAITING',message:'Menunggu izin dan posisi GPS ponsel…'});
      watch=navigator.geolocation.watchPosition(async pos=>{
        if(disposed||!route||sending||Date.now()-lastSent<30000)return;
        if(Date.now()-pos.timestamp>120000){set({status:'STALE',message:'Posisi GPS sudah lama; menunggu posisi baru.'});return;}
        sending=true;const target=route;
        try{
          const res=await deliveryApi.reportLocation(target.id,{latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:pos.coords.accuracy,observedAt:new Date(pos.timestamp).toISOString()});
          if(!disposed&&route?.id===target.id&&res.data?.accepted){lastSent=Date.now();set({status:'LIVE',at:pos.timestamp,routeCode:target.code,message:'Lokasi ponsel dibagikan untuk trip ini.'});}
        }catch(error){set({status:'ERROR',message:`Lokasi belum terkirim: ${error.message}`});}finally{sending=false;}
      },err=>set({status:err.code===1?'DENIED':'UNAVAILABLE',message:err.code===1?'Izin GPS ditolak. Aktifkan izin lokasi browser; pemantauan memakai titik absensi terakhir.':'GPS belum tersedia. Pemantauan memakai titik absensi terakhir.'}),{enableHighAccuracy:true,maximumAge:10000,timeout:20000});
    };
    let querying=false;
    const sync=async()=>{
      if(querying)return;querying=true;
      try{
        const response=await collectPages(deliveryApi.getDeliveryRoutes,{open:'true'});
        if(disposed)return;
        const candidates=response.data.filter(r=>['IN_TRANSIT','COMPLETED','PARTIAL'].includes(r.status)&&!r.returnedAt&&!r.closedAt&&!r.cancelledAt);
        const next=candidates.length===1?candidates[0]:null;
        if(next?.id!==route?.id){stop();route=next;lastSent=0;if(route)start();}
        if(!next){stop();route=null;set({status:'IDLE',message:candidates.length>1?'Ada beberapa trip aktif. Gudang perlu menyelesaikan bentrok sebelum pelacakan.':'GPS trip aktif setelah berangkat hingga kembali gudang.'});}
      }catch(error){stop();route=null;set({status:'ERROR',message:`Tidak dapat memeriksa trip: ${error.message}`});}finally{querying=false;}
    };
    const freshness=setInterval(()=>setState(previous=>previous.status==='LIVE'&&Date.now()-previous.at>120000?{...previous,status:'STALE',message:'GPS belum memperbarui posisi selama lebih dari 2 menit. Gudang melihat posisi terakhir.'}:previous),15000);
    sync();const timer=setInterval(sync,30000);window.addEventListener('delivery:changed',sync);window.addEventListener('online',sync);
    return()=>{disposed=true;stop();clearInterval(timer);clearInterval(freshness);window.removeEventListener('delivery:changed',sync);window.removeEventListener('online',sync);};
  },[user?.id,user?.role]);
  return state;
}
