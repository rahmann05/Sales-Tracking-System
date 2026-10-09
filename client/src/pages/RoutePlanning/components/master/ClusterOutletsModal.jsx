import React, {useEffect,useState} from 'react';
import {clustersApi,outletsApi,collectPages} from '../../../../services/api';
import {GuardedDialog} from '../../../../shared/components/common/GuardedDialog';
import {ClusterImpactReview} from './ClusterImpactReview';
import {OutletListPanel} from './OutletListPanel';
export function ClusterOutletsModal({cluster,onClose,onSaved}) {
  const [outlets,setOutlets]=useState([]),[selected,setSelected]=useState([]),[query,setQuery]=useState('');
  const [review,setReview]=useState(null),[changed,setChanged]=useState(false);
  const [tradeType,setTradeType]=useState('GENERAL_TRADE');
  const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[revision,setRevision]=useState(0);
  useEffect(()=>{
    if(!cluster)return;let live=true;setLoading(true);setError('');setReview(null);setChanged(false);setQuery('');setOutlets([]);setSelected([]);
    Promise.all([clustersApi.getById(cluster.id),collectPages(outletsApi.getAll,{planningPool:true})]).then(([detail,all])=>{if(live){setOutlets([...new Map([...all.data,...detail.data.outlets].map(outlet=>[outlet.id,outlet])).values()]);setSelected(detail.data.outlets.map(outlet=>outlet.id));setTradeType(detail.data.outlets[0]?.type || 'GENERAL_TRADE');}}).catch(err=>{if(live)setError(err.message);}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[cluster,revision]);
  const save=async()=>{if(outlets.some(outlet=>selected.includes(outlet.id)&&outlet.type!==tradeType)){setError('Lepaskan outlet dengan jenis berbeda sebelum menyimpan.');return;}setBusy(true);setError('');try{if(!review){setReview((await clustersApi.impact({clusterId:cluster.id,outletIds:selected})).data);return;}await clustersApi.updateOutlets(cluster.id,selected,review.token);onClose();await onSaved();window.dispatchEvent(new CustomEvent('operational-data-changed'));}catch(err){setReview(null);setError(err.message);}finally{setBusy(false);}};
  return <GuardedDialog className="planning-dialog" dirty={Boolean(cluster)&&changed} open={Boolean(cluster)} title={`Outlet · ${cluster?.name || ''}`} onClose={onClose} busy={busy}><div className="app-form">
    <p>Pilih outlet anggota wilayah. Outlet yang dilepas masuk ke “Belum Ditugaskan”. Rute referensi yang terdampak dibersihkan; histori kunjungan tetap tersimpan.</p>
    {error&&<div role="alert" className="app-error">{error}<button type="button" className="app-button" onClick={()=>setRevision(value=>value+1)} disabled={busy}>Muat ulang</button></div>}
    {loading?<p role="status">Memuat anggota kluster…</p>:<><label className="app-field">Jenis kluster<select value={tradeType} disabled={busy} onChange={e=>{if(selected.length){setError('Lepaskan pilihan outlet dahulu untuk mengganti jenis perdagangan.');return;}setTradeType(e.target.value);setReview(null);setChanged(true);}}><option value="GENERAL_TRADE">General Trade</option><option value="MODERN_TRADE">Modern Trade</option></select></label><p>Lepaskan semua pilihan sebelum mengganti jenis. Hanya outlet dengan jenis yang sama dapat disimpan.</p><label className="app-field">Cari outlet<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label><OutletListPanel outlets={outlets.filter(outlet=>selected.includes(outlet.id)||outlet.type===tradeType).filter(outlet=>`${outlet.name} ${outlet.outletCode || ''}`.toLowerCase().includes(query.toLowerCase()))} selectedIds={selected} disabled={busy} onToggle={id=>{setReview(null);setChanged(true);setSelected(previous=>previous.includes(id)?previous.filter(value=>value!==id):[...previous,id]);}}/><p>{selected.length} outlet dipilih</p></>}
    <ClusterImpactReview review={review}/><div className="app-actions"><button type="button" className="app-button app-button-primary" onClick={save} disabled={busy||loading||!outlets.length}>{busy?'Memproses…':review?'Simpan anggota outlet':'Tinjau perpindahan outlet'}</button></div>
  </div></GuardedDialog>;
}
