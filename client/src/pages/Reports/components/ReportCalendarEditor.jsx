import { NativeDialog } from '../../../shared/components/common/NativeDialog';
import React, { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { reportsApi } from '../../../services/api';
import { DAY_NAMES, workingDays } from '../../../../../shared/working-calendar.mjs';
import { validMonth } from '../../../../../shared/report-calendar.mjs';

export function ReportCalendarEditor({ month, onSaved }) {
  const {user,settings}=useApp();
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState('');
  const [saved,setSaved]=useState(null),[history,setHistory]=useState([]),[weekdays,setWeekdays]=useState([]),[exceptions,setExceptions]=useState([]),[reason,setReason]=useState('');
  useEffect(()=>{
    if(!open)return;let active=true;setBusy(true);setLoaded(false);setError('');
    reportsApi.getCalendar({month}).then(response=>{
      if(!active)return;const calendar=response.data.calendar;setSaved(calendar);setHistory(response.data.history||[]);
      setWeekdays(calendar?.weekdays||workingDays(settings?.PJP_WORKING_DAYS||'1,2,3,4,5,6'));setExceptions(calendar?.exceptions||[]);setReason('');setLoaded(true);
    }).catch(err=>{if(active)setError(err.message);}).finally(()=>{if(active)setBusy(false);});
    return()=>{active=false;};
  },[open,month,settings?.PJP_WORKING_DAYS]);
  if(user?.role!=='ADMIN'||user.permissions?.can_view_reports===false||!validMonth(month))return null;
  const lastDay=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).getUTCDate();
  const updateException=(index,patch)=>setExceptions(rows=>rows.map((row,i)=>i===index?{...row,...patch}:row));
  const submit=async event=>{
    event.preventDefault();setSaving(true);setError('');
    try{await reportsApi.saveCalendar({month,weekdays,exceptions,revision:saved?.revision||0,reason});setOpen(false);onSaved?.();}
    catch(err){setError(`${err.message}${err.status===409?' Tutup dan buka kembali untuk memuat versi terbaru.':''}`);}
    finally{setSaving(false);}
  };
  return <>
    <button type="button" className="app-button text-xs" onClick={()=>setOpen(true)}>Kalender laporan {month}</button>
    {open&&<NativeDialog open title={`Kalender laporan ${month}`} busy={saving} onClose={()=>setOpen(false)} className="admin-calendar-dialog">
      <div className="space-y-4">
        <p className="text-xs">Tetapkan hari kerja periode ini sesuai kondisi sebenarnya. Kalender ini untuk laporan dan tidak mengubah jadwal PJP.</p>
        {error&&<p role="alert" className="app-error">{error}</p>}
        {busy?<p role="status">Memuat kalender dan riwayat…</p>:loaded&&<form className="space-y-3" onSubmit={submit}>
          {!saved&&<p className="text-xs">Hari di bawah adalah saran dari pengaturan saat ini. Periksa sebelum menetapkannya sebagai kalender bulan ini.</p>}
          <fieldset disabled={saving} className="space-y-2"><legend className="font-semibold">Hari kerja mingguan</legend>
            <div className="flex flex-wrap gap-3">{[1,2,3,4,5,6,0].map(day=><label key={day}><input type="checkbox" checked={weekdays.includes(day)} onChange={e=>setWeekdays(values=>e.target.checked?[...values,day]:values.filter(value=>value!==day))}/> {DAY_NAMES[day]}</label>)}</div>
            <p className="text-xs">Jika tidak ada hari yang dipilih, seluruh bulan dianggap libur kecuali tanggal yang ditetapkan sebagai kerja.</p>
          </fieldset>
          <fieldset disabled={saving} className="space-y-2"><legend className="font-semibold">Pengecualian tanggal</legend>
            {exceptions.map((row,index)=><div key={index} className="flex flex-wrap items-end gap-2">
              <label>Tanggal<input type="date" className="app-input" required min={`${month}-01`} max={`${month}-${lastDay}`} value={row.date} onChange={e=>updateException(index,{date:e.target.value})}/></label>
              <label>Status<select className="app-input" value={row.working?'WORK':'OFF'} onChange={e=>updateException(index,{working:e.target.value==='WORK'})}><option value="OFF">Libur</option><option value="WORK">Kerja</option></select></label>
              <button type="button" className="app-button" aria-label={`Hapus pengecualian ${row.date||index+1}`} onClick={()=>setExceptions(rows=>rows.filter((_,i)=>i!==index))}>Hapus</button>
            </div>)}
            <button type="button" className="app-button" disabled={exceptions.length>=31} onClick={()=>setExceptions(rows=>[...rows,{date:'',working:false}])}>Tambah tanggal</button>
          </fieldset>
          <label className="block">Alasan penetapan/revisi<textarea className="app-input w-full" required minLength={5} maxLength={1000} value={reason} disabled={saving} onChange={e=>setReason(e.target.value)}/></label>
          <button type="submit" className="app-button" disabled={saving}>{saving?'Menyimpan…':'Simpan kalender'}</button>
        </form>}
        <button type="button" className="app-button" disabled={saving} onClick={()=>setOpen(false)}>Tutup</button>
        <details><summary>Riwayat perubahan (30 terakhir)</summary>{history.length?history.map(event=><p key={event.id} className="text-xs border-b py-2">Versi {event.after?.revision} · {new Date(event.createdAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB · {event.actorName||'Admin'} · Hari kerja: {(event.after?.weekdays||[]).map(day=>DAY_NAMES[day]).join(', ')||'Tidak ada'} · Pengecualian: {(event.after?.exceptions||[]).map(row=>`${row.date} ${row.working?'kerja':'libur'}`).join('; ')||'Tidak ada'} · {event.after?.reason}</p>):<p>Belum ada penetapan kalender.</p>}</details>
      </div>
    </NativeDialog>}
  </>;
}
