import React from 'react';
import { stamp } from '../../OutletManagement/outletPresentation';

const STATUS_LABELS = {
  OPEN: 'Perlu dikerjakan',
  SUBMITTED: 'Menunggu pemeriksa',
  DONE: 'Bukti diterima',
  CANCELLED: 'Dibatalkan',
};

export function OutletFieldTaskTable({ busy, error, data, page, setPage, sales, onSelect }) {
  return (
    <>
      <div className="ov-table-wrap" aria-busy={busy}>
        <table className="ov-table ov-queue">
          <caption>
            {busy ? 'Memuat daftar…' : `${data?.pagination.total ?? 0} tugas sesuai filter`}
          </caption>
          <thead>
            <tr>
              <th>Outlet / penugasan</th>
              <th>Petugas / pemeriksa</th>
              <th>Status / tenggat</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((t) => (
              <tr key={t.id}>
                <td data-label="Outlet / penugasan">
                  <strong>{t.review.outlet.name}</strong>
                  <small>
                    {t.review.outlet.outletCode || 'Tanpa kode'} · {t.review.outlet.cluster?.name}
                  </small>
                  <small>Ditugaskan {stamp(t.createdAt)}</small>
                  <small>{t.instructions}</small>
                </td>
                <td data-label="Petugas / pemeriksa">
                  {t.ownerName}
                  <small>Pemeriksa: {t.reviewerName}</small>
                </td>
                <td data-label="Status / tenggat">
                  <span className={`ov-tag ${t.overdue ? 'is-overdue' : ''}`}>
                    {STATUS_LABELS[t.status]}
                    {t.overdue ? ' · terlambat' : ''}
                  </span>
                  <small>
                    {t.status === 'SUBMITTED'
                      ? `Menunggu ${t.waitingHours} jam · tenggat pemeriksa ${stamp(t.reviewDueAt)}`
                      : `Tenggat pengerjaan ${stamp(t.dueAt)}`}
                  </small>
                  {t.schedule?.mode === 'TODAY_ONLY' && (
                    <small>Agenda satu hari: {t.schedule.assignedOn}</small>
                  )}
                </td>
                <td data-label="Tindakan">
                  <button type="button" className="app-button" onClick={() => onSelect(t.id)}>
                    {sales ? 'Buka tugas' : 'Bukti & riwayat'}
                  </button>
                </td>
              </tr>
            ))}
            {!busy && !error && !data?.items.length && (
              <tr>
                <td colSpan={4}>
                  <div className="ov-empty">Tidak ada tugas sesuai filter.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <nav className="outlet-pagination" aria-label="Halaman tugas validasi">
        <button
          type="button"
          className="app-button"
          disabled={busy || page <= 1}
          onClick={() => setPage((v) => v - 1)}
        >
          Sebelumnya
        </button>
        <span>
          Halaman {data?.pagination.page || page} / {data?.pagination.totalPages || 1} ·{' '}
          {data?.pagination.total ?? 0} tugas
        </span>
        <button
          type="button"
          className="app-button"
          disabled={busy || !data || page >= data.pagination.totalPages}
          onClick={() => setPage((v) => v + 1)}
        >
          Berikutnya
        </button>
      </nav>
    </>
  );
}
