import React, {useEffect,useState} from 'react';
import {clustersApi,outletsApi,collectPages} from '../../../../services/api';
import {NativeDialog} from '../../../../shared/components/common/NativeDialog';
import {OutletListPanel} from './OutletListPanel';
export function ClusterOutletsModal({cluster,onClose,onSaved}) {
  const [outlets,setOutlets]=useState([]),[selected,setSelected]=useState([]),[query,setQuery]=useState('');
  const [tradeType,setTradeType]=useState('GENERAL_TRADE');
  const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[revision,setRevision]=useState(0);
  useEffect(()=>{
    if(!cluster)return;let live=true;setLoading(true);setError('');setQuery('');setOutlets([]);setSelected([]);
    Promise.all([clustersApi.getById(cluster.id),collectPages(outletsApi.getAll)]).then(([detail,all])=>{if(live){setOutlets([...new Map([...all.data,...detail.data.outlets].map(outlet=>[outlet.id,outlet])).values()]);setSelected(detail.data.outlets.map(outlet=>outlet.id));setTradeType(detail.data.outlets[0]?.type || 'GENERAL_TRADE');}}).catch(err=>{if(live)setError(err.message);}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[cluster,revision]);
  const save=async()=>{if(outlets.some(outlet=>selected.includes(outlet.id)&&outlet.type!==tradeType)){setError('Lepaskan outlet dengan jenis berbeda sebelum menyimpan.');return;}setBusy(true);setError('');try{await clustersApi.updateOutlets(cluster.id,selected);onClose();await onSaved();window.dispatchEvent(new CustomEvent('operational-data-changed'));}catch(err){setError(err.message);}finally{setBusy(false);}};
  return <NativeDialog open={Boolean(cluster)} title={`Outlet · ${cluster?.name || ''}`} onClose={onClose} busy={busy}><div className="app-form">
    <p>Pilih outlet anggota wilayah. Outlet yang dilepas masuk ke “Belum Ditugaskan”. Rute referensi yang terdampak dibersihkan; histori kunjungan tetap tersimpan.</p>
    {error&&<div role="alert" className="app-error">{error}<button type="button" className="app-button" onClick={()=>setRevision(value=>value+1)} disabled={busy}>Muat ulang</button></div>}
    {loading?<p role="status">Memuat anggota kluster…</p>:<><label className="app-field">Jenis kluster<select value={tradeType} disabled={busy} onChange={e=>{setTradeType(e.target.value);setSelected([]);}}><option value="GENERAL_TRADE">General Trade</option><option value="MODERN_TRADE">Modern Trade</option></select></label><p>Perubahan jenis mengosongkan pilihan outlet. Hanya outlet dengan jenis yang sama dapat disimpan.</p><label className="app-field">Cari outlet<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label><OutletListPanel outlets={outlets.filter(outlet=>selected.includes(outlet.id)||outlet.type===tradeType).filter(outlet=>`${outlet.name} ${outlet.outletCode || ''}`.toLowerCase().includes(query.toLowerCase()))} selectedIds={selected} disabled={busy} onToggle={id=>setSelected(previous=>previous.includes(id)?previous.filter(value=>value!==id):[...previous,id])}/><p>{selected.length} outlet dipilih</p></>}
    <div className="app-actions"><button type="button" className="app-button" onClick={onClose} disabled={busy}>Batal</button><button type="button" className="app-button app-button-primary" onClick={save} disabled={busy||loading||Boolean(error)}>{busy?'Menyimpan…':'Simpan anggota outlet'}</button></div>
  </div></NativeDialog>;
}
