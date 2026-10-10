import { DataTable } from './DataTable';
import React, { useEffect, useState } from 'react';
import { staffAttendanceApi } from '../../../services/api';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
import {shiftTimeView} from '../../../../../shared/shift-policy.mjs';
import {useApp} from '../../../context/AppContext';
import {ShiftCorrectionDialog} from './ShiftCorrectionDialog';

export function StaffAttendanceReport() {
  const {user}=useApp();
  const [date, setDate] = useState(wibDateKey());
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingOnly,setPendingOnly]=useState(false),[selected,setSelected]=useState(null),[revision,setRevision]=useState(0);
  const correctionAccess=user.role==='ADMIN'&&['can_propose_shift_correction','can_review_shift_correction'].some(k=>user.permissions?.[k]===true);
  useEffect(() => {
    let active = true; setLoading(true); setError('');setRows([]);
    (pendingOnly?staffAttendanceApi.pendingShiftCorrections():staffAttendanceApi.report(date)).then(res => { if (active) setRows(res.data); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [date,pendingOnly,revision,user.id]);
  const time = value => value ? new Date(value).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day:'2-digit',month:'2-digit',hour: '2-digit', minute: '2-digit' }) : '—';
  return <section className="bg-surface rounded-2xl p-4 border border-border-glass space-y-4">
    <div className="flex flex-wrap gap-3 justify-between"><h3 className="font-bold text-lg">Riwayat shift & supervisi</h3><label className="text-sm">Tanggal kerja <input type="date" disabled={pendingOnly} className="form-input" value={date} onChange={e => { if (e.target.value) setDate(e.target.value); }} /></label>{correctionAccess&&<label className="flex items-center gap-2 text-sm min-h-11"><input type="checkbox" checked={pendingOnly} onChange={e=>setPendingOnly(e.target.checked)}/>Usulan koreksi lintas tanggal</label>}</div>
    <p className="text-sm text-on-surface-variant">Shift malam mengikuti tanggal kerja sesuai aturan. Waktu kegiatan tanpa presensi dan koreksi administratif dibedakan dari bukti masuk/keluar asli.</p>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {loading ? <p role="status">Memuat riwayat…</p> : <div className="overflow-x-auto"><DataTable className="w-full text-sm text-left"><thead><tr>{['Nama','Aktivitas','Toko','Masuk asli (WIB)','Keluar asli (WIB)','Keterangan',...(correctionAccess?['Koreksi']:[])].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(r=>{const t=shiftTimeView(r);return <tr className="border-t border-border-glass" key={r.id}><td>{r.user?.name}</td><td>{{SHIFT:'Shift',VISIT:'Supervisi toko',OFF_PJP:'Luar PJP'}[r.kind]}{pendingOnly&&<p>{r.dateKey}</p>}</td><td>{r.outletName||'—'}</td><td>{time(t.actualIn)}</td><td>{time(t.actualOut)}</td><td>{r.kind==='SHIFT'?(t.lateMinutes===null?'Presensi tidak diwajibkan':t.lateMinutes?`Terlambat ${t.lateMinutes} menit${t.corrected?' (koreksi diterima)':''}`:'Tepat waktu'+(t.corrected?' (koreksi diterima)':'')):r.notes||'—'}{t.corrected&&<p className="text-xs mt-2">Waktu koreksi diterima: {time(t.reportedIn)} → {time(t.reportedOut)}</p>}{r.timeCorrection?.pending&&<p className="text-xs mt-2">Usulan koreksi menunggu pemeriksaan</p>}</td>{correctionAccess&&<td>{r.kind==='SHIFT'&&t.actualIn&&<button type="button" className="app-button" onClick={()=>setSelected(r)}>Koreksi / riwayat</button>}</td>}</tr>;})}</tbody></DataTable>{!rows.length&&!error&&<p className="p-3 text-on-surface-variant">{pendingOnly?'Tidak ada usulan koreksi menunggu keputusan.':'Belum ada catatan pada tanggal kerja ini.'}</p>}{pendingOnly&&rows.length===100&&<p>Menampilkan 100 usulan tertua. Selesaikan untuk memuat antrean berikutnya.</p>}</div>}
    {selected&&<ShiftCorrectionDialog row={selected} onClose={()=>setSelected(null)} onSaved={async()=>setRevision(v=>v+1)}/>}
  </section>;
}
