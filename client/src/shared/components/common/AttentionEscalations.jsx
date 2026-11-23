import React, { useCallback, useEffect, useRef, useState } from 'react';
import { request } from '../../../services/httpClient';
import { useApp } from '../../../context/AppContext';

export function AttentionEscalations() {
  const { user } = useApp();
  const allowed = user?.role === 'ADMIN';
  const [data, setData] = useState(null),
    [page, setPage] = useState(1),
    [unread, setUnread] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const revision = useRef(0);
  const scope = `${user?.id}:${page}:${unread}`;

  const load = useCallback(async () => {
    if (!allowed) return;
    const version = ++revision.current;
    setBusy(true);
    try {
      const res = await request(`/attention/escalations?page=${page}&unread=${unread}`);
      if (version === revision.current) {
        setData({ ...res.data, scope });
        setError('');
      }
    } catch (err) {
      if (version === revision.current) setError(err.message);
    } finally {
      if (version === revision.current) setBusy(false);
    }
  }, [allowed, page, unread, scope]);

  useEffect(() => {
    setData(null);
    if (!allowed) return;
    load();
    const timer = setInterval(load, 60000);
    window.addEventListener('focus', load);
    return () => {
      revision.current++;
      clearInterval(timer);
      window.removeEventListener('focus', load);
    };
  }, [allowed, load]);

  if (!allowed) return null;

  const read = async (id) => {
    setBusy(true);
    setError('');
    try {
      await request(`/notifications/${id}/read`, { method: 'PATCH' });
      window.dispatchEvent(new Event('notifications:changed'));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const current = data?.scope === scope;

  return (
    <section className="work-escalations" aria-label="Eskalasi SLA">
      <div className="work-escalations-head">
        <div className="work-escalations-title">
          <h3>Eskalasi SLA</h3>
          <span
            className={
              current && data.unreadCount > 0 ? 'admin-status admin-status-pending' : 'admin-status'
            }
          >
            {current ? `${data.unreadCount} belum dibaca` : 'Memuat status…'}
          </span>
        </div>
        <div className="work-escalations-controls">
          <label className="app-field">
            <span>Tampilkan</span>
            <select
              value={unread ? 'UNREAD' : 'ALL'}
              onChange={(event) => {
                setUnread(event.target.value === 'UNREAD');
                setPage(1);
              }}
            >
              <option value="UNREAD">Belum dibaca</option>
              <option value="ALL">Semua riwayat</option>
            </select>
          </label>
          <button type="button" className="app-button" disabled={busy} onClick={load}>
            {busy ? 'Memuat…' : 'Perbarui eskalasi'}
          </button>
        </div>
      </div>

      <p className="work-escalations-note">
        Pemberitahuan berdasarkan status saat pemindaian. Membaca notifikasi tidak menyelesaikan
        pekerjaan; periksa antrean untuk status terbaru. Diperbarui setiap menit saat panel terbuka.
      </p>

      {busy && !current && (
        <p role="status" className="work-escalations-status">
          Memuat eskalasi…
        </p>
      )}
      {error && (
        <p role="alert" className="app-error">
          {error}
        </p>
      )}

      {current && !error && data.items.length > 0 && (
        <ul className="work-escalations-list">
          {data.items.map((item) => (
            <li key={item.id} className="work-escalations-item">
              <div className="work-escalations-item-body">
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small>
                  {new Date(item.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}{' '}
                  WIB
                </small>
              </div>
              {!item.isRead && (
                <button
                  type="button"
                  className="app-button"
                  disabled={busy}
                  onClick={() => read(item.id)}
                >
                  Tandai dibaca
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {current && !busy && !error && !data.items.length && (
        <p className="app-empty">Tidak ada eskalasi sesuai filter.</p>
      )}

      <footer className="admin-pagination" aria-label="Halaman eskalasi">
        <span>
          Halaman {page} · {current ? data.total : '—'} pemberitahuan
        </span>
        <div>
          <button
            type="button"
            disabled={busy || page === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Sebelumnya
          </button>
          <button
            type="button"
            disabled={busy || !current || page * data.limit >= data.total}
            onClick={() => setPage((value) => value + 1)}
          >
            Berikutnya
          </button>
        </div>
      </footer>
    </section>
  );
}
