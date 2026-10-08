import React, { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { request } from '../../../services/httpClient';
import { syncHealth } from '../../../../../shared/monitoring.mjs';
import { LuActivity } from 'react-icons/lu';

const labels = { CURRENT: 'Terbaru', WAITING: 'Belum terkonfirmasi', ERROR: 'Gagal diperbarui', STALE: 'Data sudah lama', OFFLINE: 'Perangkat offline' };
const time = value => value ? new Date(value).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB' : 'Belum ada';
export function MonitoringStatus() {
  const { user, syncStatus, notificationStatus, driverTracking } = useApp();
  const [now, setNow] = useState(Date.now()), [online, setOnline] = useState(navigator.onLine);
  const [server, setServer] = useState(null), [error, setError] = useState('');
  useEffect(() => {
    const update = () => { setNow(Date.now()); setOnline(navigator.onLine); };
    const timer = setInterval(update, 15000);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { clearInterval(timer); window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => {
    setServer(null); setError('');
    if (user?.role !== 'ADMIN') return;
    let disposed = false, busy = false;
    const load = async () => {
      if (busy) return; busy = true;
      try { const res = await request('/health/monitoring'); if (!disposed) { setServer(res.data); setError(''); } }
      catch (err) { if (!disposed) setError(err.message); } finally { busy = false; }
    };
    load(); const timer = setInterval(load, 60000); window.addEventListener('focus', load); window.addEventListener('online', load);
    return () => { disposed = true; clearInterval(timer); window.removeEventListener('focus', load); window.removeEventListener('online', load); };
  }, [user?.id, user?.role]);
  const data = syncHealth(syncStatus, now, online), notifications = syncHealth(notificationStatus, now, online);
  const jobsBad = user?.role === 'ADMIN' && (error || !server || !server.schedulerInitialized || now - Date.parse(server.observedAt) > 150000 || server.jobs.some(job => ['FAILED', 'STALLED', 'OVERDUE'].includes(job.status)));
  const gpsBad = user?.role === 'SUPIR' && ['ERROR', 'STALE', 'DENIED', 'UNAVAILABLE', 'OFFLINE', 'BACKGROUND'].includes(driverTracking?.status);
  const warning = data !== 'CURRENT' || notifications !== 'CURRENT' || jobsBad || gpsBad;
  return <details className="relative text-xs">
    <summary aria-label={`Status pemantauan: ${warning ? 'perlu diperiksa' : 'terhubung'}`} className={`cursor-pointer min-h-11 min-w-11 flex items-center justify-center gap-1 rounded-lg border px-2 ${warning ? 'text-amber-700 bg-amber-50' : 'text-on-surface'}`}><LuActivity aria-hidden="true"/><span className="hidden sm:inline">Pemantauan · {warning ? 'Periksa' : 'Terhubung'}</span><span className="sr-only sm:hidden">{warning ? 'Periksa pemantauan' : 'Pemantauan terhubung'}</span></summary>
    <div className="fixed left-3 right-3 top-20 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:w-96 p-4 rounded-xl border bg-surface text-on-surface shadow-xl z-50 space-y-3 max-h-[70vh] overflow-y-auto" role="status">
      <p><strong>Data utama: {labels[data]}</strong><br/>Sinkronisasi lengkap terakhir: {time(syncStatus?.lastSuccessAt)}<br/>{syncStatus?.error}</p>
      <p><strong>Notifikasi: {labels[notifications]}</strong><br/>Terakhir: {time(notificationStatus?.lastSuccessAt)}<br/>{notificationStatus?.error}</p>
      {user?.role === 'SUPIR' && <p><strong>GPS driver: {driverTracking?.status || 'WAITING'}</strong><br/>{driverTracking?.message}<br/>Posisi terkirim: {time(driverTracking?.at)}</p>}
      {user?.role === 'ADMIN' && <div className="space-y-2"><strong>Scheduler server</strong>{error && <p role="alert">Status server gagal diperiksa: {error}</p>}{!server && <p>Belum terkonfirmasi.</p>}{server && <><p>Pemeriksaan database: {server.database} pada {time(server.observedAt)}{now - Date.parse(server.observedAt) > 150000 && ' · Pemeriksaan sudah lama'}</p>{!server.schedulerInitialized && <p>Scheduler belum diinisialisasi pada proses server ini.</p>}{server.jobs.map(job => <p key={job.id}>{job.label}: <strong>{job.status}</strong>{job.lastOutcome === 'DISABLED' && ' · Eskalasi dinonaktifkan oleh konfigurasi'}<br/>Berhasil terakhir: {time(job.lastSuccessAt)}<br/>Gagal terakhir: {time(job.lastFailedAt)}<br/>Jadwal berikut: {time(job.nextDueAt)}</p>)}<p>{server.basis}</p></>}</div>}
      <p>Data utama dan notifikasi diperbarui setiap menit selama halaman aktif. Modul yang dimuat terpisah memiliki status pemuatan sendiri. Terhubung bukan bukti pekerjaan sudah selesai.</p>
    </div>
  </details>;
}
