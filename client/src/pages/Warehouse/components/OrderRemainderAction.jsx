import React,{useState} from 'react';
import {ordersApi} from '../../../services/api';
export function OrderRemainderAction({order,onChanged}){
  const [quantities,setQuantities]=useState({}),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const lines=order.fulfillmentLines.filter(i=>i.unpacked>0);
  if(order.status!=='APPROVED'||!lines.length)return null;
  const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{
    const selected=lines.map(i=>({id:i.id,quantity:Number(quantities[i.id]||0)})).filter(i=>i.quantity>0);
    if(!selected.length)throw new Error('Isi jumlah sisa yang dibatalkan.');
    await ordersApi.cancelRemainder(order.id,{note,lines:selected});await onChanged();
  }catch(e){setError(e.message);}finally{setBusy(false);}};
  return <details className="border rounded-xl p-3"><summary className="cursor-pointer min-h-11">Batalkan sisa order atas konfirmasi pelanggan</summary><form onSubmit={submit} className="space-y-3"><p className="text-sm">Hanya jumlah yang belum dipacking dapat dibatalkan. Jumlah dipesan dan diterima tetap tersimpan; alasan pembatalan masuk riwayat.</p><fieldset disabled={busy} className="space-y-3">{lines.map(i=><label className="block" key={i.id}>{i.product?.name} · Maksimal {i.unpacked}<input className="form-input block w-full" type="number" min="0" max={i.unpacked} step="1" value={quantities[i.id]||''} onChange={e=>setQuantities({...quantities,[i.id]:e.target.value})}/></label>)}<label className="block">Alasan / konfirmasi pelanggan<textarea required maxLength={2000} className="form-input block w-full" value={note} onChange={e=>setNote(e.target.value)}/></label><button className="min-h-11 border rounded-xl px-3">{busy?'Menyimpan…':'Simpan pembatalan sisa'}</button></fieldset>{error&&<p role="alert" className="text-red-600">{error}</p>}</form></details>;
}
