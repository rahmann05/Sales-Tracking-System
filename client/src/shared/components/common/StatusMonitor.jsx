import React, { useEffect, useState } from 'react';
const time = ()=>new Date().toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit'});
export function StatusMonitor({label='WIB'}) {
  const [current,setCurrent] = useState(time);
  const [online,setOnline] = useState(navigator.onLine);
  useEffect(()=>{const timer=setInterval(()=>setCurrent(time()),30000);const sync=()=>setOnline(navigator.onLine);window.addEventListener('online',sync);window.addEventListener('offline',sync);return()=>{clearInterval(timer);window.removeEventListener('online',sync);window.removeEventListener('offline',sync);};},[]);
  return <span className="app-status">{current} {label} · {online?'Jaringan tersedia':'Offline'}</span>;
}
