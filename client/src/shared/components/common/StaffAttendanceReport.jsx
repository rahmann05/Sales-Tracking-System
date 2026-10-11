import {OutletValidationAttendanceReport} from './OutletValidationAttendanceReport';
import '../../../styles/pages/OutletValidation.css';
import { DataTable } from './DataTable';
import React, { useEffect, useState } from 'react';
import { staffAttendanceApi } from '../../../services/api';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
import {useApp} from '../../../context/AppContext';
import {ShiftCorrectionDialog} from './ShiftCorrectionDialog';
import {StaffAttendanceRow} from './StaffAttendanceRow';
import {ExportFormatMenu} from './ExportFormatMenu';
import {assertExportAllowed} from '../../../services/operationalExportService';
import {NativeDialog} from './NativeDialog';
import {ShiftEvidenceSummary} from './ShiftEvidenceSummary';
import {shiftTimeView} from '../../../../../shared/shift-policy.mjs';
import '../../../styles/pages/StaffAttendanceReport.css';

export function StaffAttendanceReport() {
  const {user}=useApp();
  const [date, setDate] = useState(wibDateKey());
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting,setExporting]=useState(false);
  const [detailSelected,setDetailSelected]=useState(null);
  const [pendingOnly,setPendingOnly]=useState(false),[selected,setSelected]=useState(null),[revision,setRevision]=useState(0);
  const correctionAccess=user.role==='ADMIN'&&['can_propose_shift_correction','can_review_shift_correction'].some(k=>user.permissions?.[k]===true);
  useEffect(() => {
    let active = true; setLoading(true); setError('');setRows([]);
    (pendingOnly?staffAttendanceApi.pendingShiftCorrections():staffAttendanceApi.report(date)).then(res => { if (active) {setRows(res.data);setDetailSelected(current=>current?res.data.find(row=>row.id===current.id)||null:null);} }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [date,pendingOnly,revision,user.id]);
  const exportReport=async format=>{
    setExporting(true);
    try{
      await assertExportAllowed('REPORTS');
      const details=[];
      // Bound concurrent requests and keep evidence scoped to displayed IDs.
      for(const row of rows)details.push((await staffAttendanceApi.evidence(row.id)).data);
      const {staffAttendanceExporters}=await import('../../../utils/export/reports/staffAttendanceExport');
      await staffAttendanceExporters[format](details,{date,pendingOnly,includePhotos:format!=='exportCsv'});
    }finally{setExporting(false);}
  };
  return <section className="staff-attendance-report bg-surface rounded-2xl p-4 border border-border-glass space-y-4">
    <div className="flex flex-wrap gap-3 justify-between"><h3 className="font-bold text-lg">Riwayat shift & supervisi</h3><label className="text-sm">Tanggal kerja <input type="date" disabled={pendingOnly||exporting} className="form-input" value={date} onChange={e => { if (e.target.value) setDate(e.target.value); }} /></label>{correctionAccess&&<label className="flex items-center gap-2 text-sm min-h-11"><input type="checkbox" checked={pendingOnly} disabled={exporting} onChange={e=>setPendingOnly(e.target.checked)}/>Usulan koreksi lintas tanggal</label>}</div>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-on-surface-variant">{rows.length} catatan · Waktu WIB. Pilih “Lihat detail” untuk foto, lokasi, jadwal dan riwayat koreksi.</p><ExportFormatMenu label="Ekspor riwayat" disabled={loading||exporting||!rows.length||!!error} onExportDocx={()=>exportReport('exportDocx')} onExportExcel={()=>exportReport('exportExcel')} onExportCsv={()=>exportReport('exportCsv')} onExportPdf={()=>exportReport('exportPdf')}/></div>
    <p className="text-xs text-on-surface-variant">Ekspor mengikuti {pendingOnly?'usulan koreksi lintas tanggal yang ditampilkan':'tanggal kerja yang dipilih'} ({rows.length} catatan shift / supervisi). Word, Excel dan PDF menyertakan foto; CSV mencantumkan status foto dan ID catatan. Rekap PJP validasi outlet di bawah terpisah.</p>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    <div className="staff-attendance-table-scroll" role="region" aria-label="Tabel riwayat absensi" tabIndex={0}><DataTable className="staff-attendance-table text-left">
      <caption className="sr-only">Riwayat shift dan supervisi. Waktu presensi asli dalam WIB; rincian tersedia melalui tombol Lihat detail.</caption>
      <colgroup>{[20,10,16,12,12,19,11].map((width,i)=><col key={i} style={{width:`${width}%`}}/>)}</colgroup>
      <thead><tr>{['Nama','Aktivitas','Toko','Masuk asli (WIB)','Keluar asli (WIB)','Keterangan','Aksi'].map(h=><th scope="col" key={h}>{h}</th>)}</tr></thead>
      <tbody>{loading ? <tr><td colSpan={7} className="staff-attendance-empty" role="status">Memuat riwayat…</td></tr> : rows.length ? rows.map(r=><StaffAttendanceRow key={`${r.id}:${revision}`} row={r} pendingOnly={pendingOnly} onDetails={setDetailSelected}/>) : <tr><td colSpan={7} className="staff-attendance-empty">{error?'Riwayat belum dapat ditampilkan.':pendingOnly?'Tidak ada usulan koreksi menunggu keputusan.':'Belum ada catatan pada tanggal kerja ini.'}</td></tr>}</tbody>
    </DataTable></div>
    {pendingOnly&&rows.length===100&&<p>Menampilkan 100 usulan tertua. Selesaikan untuk memuat antrean berikutnya.</p>}
    {!pendingOnly&&<OutletValidationAttendanceReport date={date}/>}
    {detailSelected&&<NativeDialog open className="staff-attendance-dialog" title={`Detail absensi · ${detailSelected.user?.name||'Staf'}`} onClose={()=>setDetailSelected(null)}>
      <ShiftEvidenceSummary key={`${detailSelected.id}:${revision}`} row={detailSelected}/>
      <div className="staff-attendance-dialog-actions">
        {correctionAccess&&detailSelected.kind==='SHIFT'&&shiftTimeView(detailSelected).actualIn&&<button type="button" className="app-button" onClick={()=>setSelected(detailSelected)}>Koreksi / riwayat</button>}
        <button type="button" className="app-button app-button-primary" onClick={()=>setDetailSelected(null)}>Tutup detail</button>
      </div>
    </NativeDialog>}
    {selected&&<ShiftCorrectionDialog row={selected} onClose={()=>setSelected(null)} onSaved={async()=>setRevision(v=>v+1)}/>}
  </section>;
}
