export const TRIP_PERMISSION_LABELS={ASSIGN_PREPARATION:'Tugaskan persiapan gudang',PICK:'Konfirmasi penyiapan',CHECK:'Konfirmasi pemeriksaan',LOAD:'Konfirmasi loading',START:'Berangkatkan trip',RETURN:'Catat kembali gudang',CLOSE:'Tutup dan rekonsiliasi trip',HOLD:'Tahan trip',RESUME:'Lanjutkan trip',RESCHEDULE:'Ubah jadwal / penugasan trip',CANCEL:'Batalkan trip',LEGACY_ODOMETER:'Rekonsiliasi odometer trip lama'};
export const tripPermission=action=>Object.hasOwn(TRIP_PERMISSION_LABELS,action)?`can_trip_${action.toLowerCase()}`:null;
export function tripPermissionDefaults(role){
 return Object.fromEntries(Object.keys(TRIP_PERMISSION_LABELS).map(action=>[tripPermission(action),['ADMIN','KEPALA_GUDANG'].includes(role)||role==='SUPIR'&&['START','RETURN'].includes(action)]));
}
export function canTripAction(user,action){
 const key=tripPermission(action),driver=user?.role==='SUPIR';
 if(!key||!['ADMIN','KEPALA_GUDANG','SUPIR'].includes(user?.role)||driver&&!['START','RETURN'].includes(action))return false;
 if(user.permissions?.[driver?'can_access_driver_map':'can_manage_delivery_routes']===false)return false;
 // Older templates inherit their existing action access until an explicit override is saved.
 return user.permissions?.[key]!==false;
}
