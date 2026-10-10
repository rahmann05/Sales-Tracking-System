import React,{useState} from 'react';
import {useApp} from '../../../context/AppContext';
import {useWorkspaceState} from '../../hooks/useWorkspaceState';
import {useFeaturePolicy} from '../../hooks/useFeaturePolicy';
import {outletValidationApi} from '../../../services/api';
import {request} from '../../../services/httpClient';
import {TAB_IDS} from '../../../constants/navigation';
export function AttentionLocationActions({row,onChanged}){
 const {user,setActiveTab}=useApp(),policy=useFeaturePolicy('OUTLET_REVIEW');
 const [,setReview]=useWorkspaceState('outletReview',''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const alert=row.locationAlert;
 const run=async action=>{setBusy(true);setMessage('');try{await action();await onChanged();}catch(e){setMessage(e.message);}finally{setBusy(false);}};
 const open=()=>run(async()=>{const r=await outletValidationApi.openReview(row.reference.outletId,{reason:`Peringatan lokasi: ${alert.label}. Periksa bukti digital sebelum penugasan lapangan.`});setReview(r.data.id);setActiveTab(TAB_IDS.OUTLET_VALIDATION);});
 const refresh=()=>run(async()=>{const r=await request(`/outlets/${row.reference.outletId}/google-location/refresh`,{method:'POST'});setMessage(r.data.lastError?'Pembaruan belum berhasil. Masa berlaku sebelumnya tidak diperpanjang.':r.data.status==='ACTIVE'?'Lokasi berhasil diperbarui.':'Lokasi perlu diperiksa ulang.');});
 return <div className="space-y-3"><p><strong>{alert.label}</strong>. {alert.usable?'Titik masih dapat digunakan sampai masa berlakunya berakhir.':'Titik belum dapat digunakan untuk rute/radius yang membutuhkan lokasi.'}</p><p className="text-sm">Dampak saat ini: {alert.impact.todayVisits} kunjungan belum selesai pada {alert.impact.todayPjp} PJP hari ini · {alert.impact.openTrips} trip terbuka. Angka ini menunjukkan penggunaan lokasi, bukan kepastian pekerjaan terblokir.</p>
 {row.target==='OUTLET_LOCATION'&&<div className="flex flex-wrap gap-3">{alert.technical&&policy.canStart&&user?.permissions?.can_run_outlet_review&&policy.settings.OUTLET_GOOGLE_LOCATION_ENABLED!==false&&policy.settings.OUTLET_MAP_COMPARISON_ENABLED!==false&&<button type="button" className="btn btn-secondary min-h-11" disabled={busy} onClick={refresh}>Coba pembaruan Google</button>}<button type="button" className="btn btn-secondary min-h-11" disabled={busy||!policy.canStart||!user?.permissions?.can_validate_outlet} title={policy.reason} onClick={open}>Buka pemeriksaan lokasi</button></div>}
 {message&&<p role="status">{message}</p>}</div>;
}
