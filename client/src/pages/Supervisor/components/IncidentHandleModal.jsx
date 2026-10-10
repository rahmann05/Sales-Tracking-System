import React, { useEffect, useState } from 'react';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';
import { useApp } from '../../../context/AppContext';
import { routeChangesApi } from '../../../services/api';
export function IncidentHandleModal({incident,onClose,onSkip,onDirectReroute}) {
  const {settings} = useApp();
  const requiresAdmin=incident?.decisionMode==='SEQUENTIAL'||incident?.decisionMode==='LEGACY_SEQUENTIAL'||!incident?.decisionMode&&settings.REROUTE_REQUIRE_ADMIN_APPROVAL;
  const [action,setAction] = useState('SKIP');
  const [outletId,setOutletId] = useState('');
  const [reason,setReason] = useState('');
  const [outlets,setOutlets] = useState([]);
  const [outletSearch,setOutletSearch]=useState('');
  const [loading,setLoading] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  useEffect(()=>{if(action!=='REROUTE'||!incident?.id)return;let live=true;setLoading(true);setOutletId('');routeChangesApi.replacements(incident.id,{search:outletSearch}).then(res=>{if(live)setOutlets(res.data||[]);}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[action,incident?.id,outletSearch]);
  const save = async e=>{e.preventDefault();setBusy(true);setError('');try{const result=action==='SKIP'?await onSkip(incident.id):await onDirectReroute({incidentId:incident.id,replacementOutletId:outletId,reason});if(result===false)setError('Keputusan belum tersimpan. Periksa notifikasi kesalahan lalu coba kembali.');}catch(err){setError(err.message);}finally{setBusy(false);}};
  return <NativeDialog open={Boolean(incident)} title={`Keputusan toko tutup: ${incident?.outletName || ''}`} busy={busy} onClose={onClose}><form className="app-form" onSubmit={save}>{incident?.decisionMode==='SEQUENTIAL'&&<p className="app-notice">Skip maupun penggantian toko menunggu keputusan Admin setelah usulan ini.</p>}<p>{incident?.reason || 'Laporan toko tutup memerlukan keputusan.'}</p><label className="app-field">Tindakan<select value={action} onChange={e=>setAction(e.target.value)} disabled={busy}><option value="SKIP">Lewati toko tanpa pengganti</option><option value="REROUTE">Ganti dengan toko lain</option></select></label>{action==='REROUTE' && <><p className="app-notice">{requiresAdmin?'Usulan menunggu persetujuan admin sebelum PJP diperbarui.':'Toko pengganti langsung ditambahkan setelah keputusan disimpan.'}</p><label className="app-field">Cari toko pengganti<input value={outletSearch} onChange={e=>setOutletSearch(e.target.value)} disabled={busy}/></label><label className="app-field">Toko pengganti (maksimal 100 hasil)<select required value={outletId} onChange={e=>setOutletId(e.target.value)} disabled={busy || loading}><option value="">{loading?'Memuat toko…':'Pilih toko pengganti'}</option>{outlets.map(o=><option key={o.id} value={o.id}>{o.name} — {o.address}</option>)}</select></label><label className="app-field">Alasan penggantian<textarea required minLength={5} value={reason} onChange={e=>setReason(e.target.value)} disabled={busy}/></label></>}{error && <p role="alert" className="app-error">{error}</p>}<div className="app-actions"><button type="button" className="app-button" onClick={onClose} disabled={busy}>Batal</button><button className="app-button app-button-primary" disabled={busy || loading}>{busy?'Menyimpan…':'Simpan keputusan'}</button></div></form></NativeDialog>;
}
