import React,{useState} from 'react';
import {deliveryApi} from '../../../services/api';
export const ReturnReceiptAction=({stop,onReceived})=>{
  const [note,setNote]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  if(!(stop.rejectedCartons>0))return null;
  if(stop.returnReceivedAt)return <p className="text-xs">Retur {stop.rejectedCartons} karton diterima gudang · {stop.returnNote}</p>;
  const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{await deliveryApi.receiveReturn(stop.id,note);await onReceived();}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <form onSubmit={submit} className="space-y-2 border rounded-xl p-3"><p>{stop.rejectedCartons} karton menunggu penerimaan retur</p><label className="block text-xs">Catatan pemeriksaan<input required className="w-full border rounded p-2" value={note} onChange={e=>setNote(e.target.value)}/></label><button disabled={busy} type="submit" className="btn btn-secondary">{busy?'Menyimpan…':'Konfirmasi retur diterima'}</button>{error&&<p role="alert" className="text-red-600">{error}</p>}</form>;
};
