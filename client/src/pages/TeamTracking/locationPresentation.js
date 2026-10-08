export function locationPresentation(row,now=Date.now(),timeoutMinutes=15){
  const source=row.locationSource;
  const valid=row.latitude!=null&&row.longitude!=null&&Number.isFinite(Number(row.latitude))&&Number.isFinite(Number(row.longitude))&&Math.abs(Number(row.latitude))<=90&&Math.abs(Number(row.longitude))<=180;
  const recorded=Date.parse(row.lastUpdated);
  const supported=['LIVE_GPS_PING','LAST_ATTENDANCE'].includes(source);
  if(!valid||!supported||!Number.isFinite(recorded))return {hasPosition:false,label:'Lokasi belum tersedia',tone:'neutral',recorded:null};
  const fresh=now-recorded<=timeoutMinutes*60000&&recorded<=now+60000;
  if(source==='LAST_ATTENDANCE')return {hasPosition:true,label:'Titik absensi terakhir',tone:'neutral',recorded};
  return {hasPosition:true,label:fresh?'GPS terkini':'GPS lama',tone:fresh?'live':'stale',recorded};
}
export const locationTime=value=>value?new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})+' WIB':'Belum ada rekaman';
