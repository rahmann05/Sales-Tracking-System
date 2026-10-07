import { DataTable } from './DataTable';
import React, { useEffect, useState } from 'react';
import { staffAttendanceApi } from '../../../services/api';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';

export function StaffAttendanceReport() {
  const [date, setDate] = useState(wibDateKey());
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    staffAttendanceApi.report(date).then(res => { if (active) setRows(res.data); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [date]);
  const time = value => value ? new Date(value).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) : '—';
  return <section className="bg-surface rounded-2xl p-4 border border-border-glass space-y-4">
    <div className="flex flex-wrap gap-3 justify-between"><h3 className="font-bold text-lg">Riwayat shift & supervisi</h3><label className="text-sm">Tanggal <input type="date" className="form-input" value={date} onChange={e => { if (e.target.value) setDate(e.target.value); }} /></label></div>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {loading ? <p role="status">Memuat riwayat…</p> : <div className="overflow-x-auto"><DataTable className="w-full text-sm text-left"><thead><tr>{['Nama', 'Aktivitas', 'Toko', 'Masuk (WIB)', 'Keluar (WIB)', 'Keterangan'].map(h => <th className="" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(r => <tr className="border-t border-border-glass" key={r.id}><td className="">{r.user?.name}</td><td className="">{{ SHIFT: 'Shift', VISIT: 'Supervisi toko', OFF_PJP: 'Luar PJP' }[r.kind]}</td><td className="">{r.outletName || '—'}</td><td className="">{time(r.checkInAt)}</td><td className="">{time(r.checkOutAt)}</td><td className="">{r.kind === 'SHIFT' ? (r.lateMinutes ? `Terlambat ${r.lateMinutes} menit` : 'Tepat waktu') : r.notes || '—'}</td></tr>)}</tbody></DataTable>{!rows.length && !error && <p className="p-3 text-on-surface-variant">Belum ada catatan pada tanggal ini.</p>}</div>}
  </section>;
}
