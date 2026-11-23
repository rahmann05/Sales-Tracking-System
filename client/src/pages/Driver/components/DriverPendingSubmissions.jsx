import React, { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { driverPendingDrafts } from '../../../../../shared/driver-pending.mjs';
import { sendDriverEvidence } from '../../../services/api/deliveryApi';
import { acknowledgeDriverQueue } from '../../../services/driverBackgroundQueue';
import { useDriverBackgroundQueue } from '../useDriverBackgroundQueue';
const queueLabels = {
  QUEUED: 'Menunggu pengiriman otomatis',
  RETRY: 'Menunggu jaringan / percobaan berikutnya',
  NEEDS_AUTH: 'Perlu sesi masuk yang aktif',
  NEEDS_REVIEW: 'Perlu pemeriksaan bukti oleh pengguna',
  PAUSED: 'Dijeda untuk pemeriksaan sebelum mengubah bukti',
};
export function DriverPendingSubmissions({ onChanged }) {
  const queue = useDriverBackgroundQueue(onChanged);
  const { user } = useApp(),
    [rows, setRows] = useState([]),
    [busy, setBusy] = useState(''),
    [error, setError] = useState('');
  const load = () => {
    const unique = new Map();
    for (const get of [() => sessionStorage, () => localStorage])
      try {
        for (const row of driverPendingDrafts(get(), user.id))
          unique.set(row.pending.requestId, row);
      } catch {}
    setRows([...unique.values()]);
  };
  useEffect(() => {
    load();
    window.addEventListener('focus', load);
    window.addEventListener('driver:drafts-changed', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('focus', load);
      window.removeEventListener('driver:drafts-changed', load);
      window.removeEventListener('storage', load);
    };
  }, [user.id]);
  const retry = async (row) => {
    if (busy) return;
    setBusy(row.key);
    setError('');
    try {
      await sendDriverEvidence(row.pending.stopId, row.pending);
      await acknowledgeDriverQueue(user, row.pending.requestId).catch(() => {});
      for (const get of [() => sessionStorage, () => localStorage])
        try {
          get().removeItem(row.key);
        } catch {}
      load();
      await onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };
  if (!rows.length && !queue.rows.length && !queue.error) return null;
  const draftIds = new Set(rows.map((row) => row.pending?.requestId));
  const backgroundOnly = queue.rows.filter((item) => !draftIds.has(item.requestId));
  return (
    <section className="admin-panel p-4 space-y-3">
      <h2>Pengiriman belum dikonfirmasi ({rows.length + backgroundOnly.length})</h2>
      <p>
        Bukti pengiriman tersimpan sementara di perangkat. Kirim ulang untuk memastikan data sudah
        diterima server tanpa menggandakan transaksi.
      </p>
      {rows.length > 0 && (
        <ul>
          {rows.map((row) => {
            const matchedQueue = queue.rows.find(
              (item) => item.requestId === row.pending?.requestId
            );
            return (
              <li className="flex flex-wrap gap-3 items-center py-2" key={row.key}>
                <span className="min-w-0 break-words">
                  {row.pending.type === 'IN' ? 'Bukti tiba' : 'Hasil pengiriman'} ·{' '}
                  {row.pending.outletName || 'Tujuan pengiriman'}
                  {matchedQueue ? ` (${queueLabels[matchedQueue.state] || matchedQueue.state})` : ''}
                </span>
                <button
                  type="button"
                  className="admin-button"
                  disabled={!!busy}
                  onClick={() => retry(row)}
                >
                  {busy === row.key ? 'Memeriksa…' : 'Kirim ulang & periksa hasil'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <p role="alert" className="app-error">
          {error} Jika server meminta perbaikan bukti, buka tujuan terkait lalu gunakan “Periksa
          hasil sebelum mengubah”.
        </p>
      )}
      {queue.error && (
        <p className="app-error" role="alert">
          Antrean otomatis: {queue.error}
        </p>
      )}
      {backgroundOnly.length > 0 && (
        <>
          <h3>Antrean otomatis ({backgroundOnly.length})</h3>
          <p>
            Bukti foto dan lokasi GPS asli tetap tersimpan aman di perangkat.{' '}
            {queue.enabled
              ? 'Akan dikirim otomatis saat jaringan dan sesi aktif tersedia.'
              : 'Pengiriman otomatis sedang dijeda oleh pengaturan; bukti tetap tersimpan.'}
          </p>
          <ul>
            {backgroundOnly.map((item) => (
              <li key={item.requestId} className="py-2 space-y-2">
                <strong className="block min-w-0 break-words">
                  {item.outletName || 'Tujuan pengiriman'}
                </strong>
                <p>
                  {queueLabels[item.state] || item.state}
                  {item.lastError ? ` · ${item.lastError}` : ''}
                </p>
                {item.state === 'NEEDS_REVIEW' && (
                  <p>
                    Periksa hasil server dan bukti pada tujuan terkait. Antrean tidak mengubah data
                    atau membuat bukti baru.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
