export const UNLOCK_KIND_LABELS={GEOFENCE:'Pengecualian radius lokasi',OUTLET_LOCK:'Izin kunjungan outlet terkunci',BOTH:'Radius lokasi dan outlet terkunci'};
export function unlockKindAllowed(kind,values={}){
 return Object.hasOwn(UNLOCK_KIND_LABELS,kind)&&(kind==='OUTLET_LOCK'||values.UNLOCK_ALLOW_GEOFENCE!==false)&&(kind==='GEOFENCE'||values.UNLOCK_ALLOW_LOCKED_OUTLET!==false);
}
